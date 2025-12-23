package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
)

type Job struct {
	URL string `json:"url"`
}

type Result struct {
	URL   string `json:"url"`
	Path  string `json:"path"`
	Error string `json:"error,omitempty"`
}

const workspaceDir = "workspace"

// Global rate limiter: 1 request every 500ms
var rateLimiter = time.Tick(500 * time.Millisecond)

// Ensure workspace exists
func ensureWorkspace() error {
	return os.MkdirAll(workspaceDir, 0755)
}

// Download with retries + rate limiting
func downloadFile(url, dest string, workerID int) error {
	maxRetries := 3
	backoff := time.Second

	for attempt := 1; attempt <= maxRetries; attempt++ {

		<-rateLimiter // rate limit

		log.Printf("[worker %d] GET %s (attempt %d)", workerID, url, attempt)

		client := &http.Client{Timeout: 20 * time.Second}
		resp, err := client.Get(url)
		if err != nil {
			log.Printf("[worker %d] error fetching %s: %v", workerID, url, err)
			time.Sleep(backoff)
			backoff *= 2
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			log.Printf("[worker %d] bad status %d for %s", workerID, resp.StatusCode, url)
			time.Sleep(backoff)
			backoff *= 2
			continue
		}

		out, err := os.Create(dest)
		if err != nil {
			return fmt.Errorf("failed to create file: %w", err)
		}
		defer out.Close()

		_, err = io.Copy(out, resp.Body)
		if err != nil {
			log.Printf("[worker %d] write error for %s: %v", workerID, url, err)
			time.Sleep(backoff)
			backoff *= 2
			continue
		}

		return nil
	}

	return fmt.Errorf("failed after %d retries", maxRetries)
}

// Extract PDF links from HTML
func extractPDFLinks(html string, baseURL string) []string {
	re := regexp.MustCompile(`href=["']([^"']+\.pdf)["']`)
	matches := re.FindAllStringSubmatch(html, -1)

	var links []string
	for _, m := range matches {
		link := m[1]

		if strings.HasPrefix(link, "/") {
			link = strings.TrimSuffix(baseURL, "/") + link
		}

		links = append(links, link)
	}

	return links
}

// Process a single portfolio URL
func processURL(job Job, workerID int) Result {
	log.Printf("[worker %d] processing %s", workerID, job.URL)

	id := strings.ReplaceAll(strings.ReplaceAll(job.URL, "https://", ""), "/", "_")
	targetDir := filepath.Join(workspaceDir, id)
	os.MkdirAll(targetDir, 0755)

	// Download HTML
	htmlPath := filepath.Join(targetDir, "index.html")
	if err := downloadFile(job.URL, htmlPath, workerID); err != nil {
		return Result{URL: job.URL, Error: err.Error()}
	}

	// Extract and download PDFs
	htmlBytes, _ := os.ReadFile(htmlPath)
	pdfLinks := extractPDFLinks(string(htmlBytes), job.URL)

	for _, pdfURL := range pdfLinks {
		pdfName := filepath.Base(pdfURL)
		pdfPath := filepath.Join(targetDir, pdfName)
		downloadFile(pdfURL, pdfPath, workerID)
	}

	return Result{URL: job.URL, Path: targetDir}
}

// Worker pool
func runWorkerPool(jobs []Job, workers int) []Result {
	jobChan := make(chan Job)
	resultChan := make(chan Result)

	var wg sync.WaitGroup

	for i := 0; i < workers; i++ {
		workerID := i + 1
		wg.Add(1)

		go func(id int) {
			defer wg.Done()
			for job := range jobChan {
				resultChan <- processURL(job, id)
			}
		}(workerID)
	}

	go func() {
		for _, job := range jobs {
			jobChan <- job
		}
		close(jobChan)
	}()

	go func() {
		wg.Wait()
		close(resultChan)
	}()

	var results []Result
	for r := range resultChan {
		results = append(results, r)
	}

	return results
}

// Main entrypoint
func main() {
	ensureWorkspace()

	var jobs []Job
	json.NewDecoder(os.Stdin).Decode(&jobs)

	results := runWorkerPool(jobs, 4)

	json.NewEncoder(os.Stdout).Encode(results)
}
