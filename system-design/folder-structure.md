recruiterleadgen/
│
├── backend/                      # Stage 1: Recruiter query + Google API
│   ├── query_handler.ts
│   ├── google_api_client.ts
│   └── Dockerfile                # Container for recruiter query + API search
│
├── iq_layers/                    # Stage 2: Foundry IQ
│   ├── foundry_client.ts         # Normalize + citations
│   └── Dockerfile                # Container for Foundry IQ
│
├── database/                     # Stage 3: Candidate persistence
│   ├── schema.sql                # Candidate table (portfolio, skills, flags)
│   ├── db_client.ts
│   ├── migrations/
│   └── Dockerfile                # Container for DB operations
│
├── comms/                        # Stage 4: Email sending
│   ├── graph_client.ts           # Microsoft Graph API integration
│   ├── ses_client.ts             # AWS SES integration
│   ├── mail_orchestrator.ts      # Update DB flags after sending emails
│   └── Dockerfile                # Container for comms/email stage
│
├── work_iq/                      # Stage 5: Work IQ validation
│   ├── work_client.ts            # Validate recruiter context (emails, resumes, chats)
│   └── Dockerfile                # Container for Work IQ validation
│
├── output/                       # Stage 6: Recruiter-facing results
│   ├── cli_output.ts             # Command-line interface rendering
│   ├── gui_output.ts             # Lightweight GUI / Copilot card rendering
│   └── Dockerfile                # Container for output stage
│
├── common/                       # Shared utilities
│   ├── logging.ts
│   ├── models.rs                 # Candidate dataclasses
│   └── io.py                     # Read/write helpers
│
├── .github/
│   └── workflows/
│       └── pipeline.yml          # GitHub Actions pipeline orchestration
│
├── docs/
│   ├── architecture.md           # Outline of workflow
│   ├── workflow_diagram.png      # Visual diagram
│   └── folder-structure.md       # Documentation of this layout
└── README.md


