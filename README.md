# Hospital_Chain

## Vision

Hospital_Chain is a decentralized healthcare data management system built on the Internet Computer. Our vision is to empower patients with ownership of their medical data, enhance data security and integrity, and facilitate a transparent marketplace for medical research.

## The Problem

Traditional healthcare data systems are plagued with numerous issues:

*   **Data Silos:** Patient data is fragmented across various hospitals and clinics, making it difficult to get a holistic view of a patient's medical history.
*   **Lack of Patient Control:** Patients have little to no control over who accesses their medical data and for what purpose.
*   **Security Vulnerabilities:** Centralized databases are prime targets for data breaches, putting sensitive patient information at risk.
*   **Inefficient Data Sharing:** Sharing data between healthcare providers and with researchers is often a cumbersome and insecure process.
*   **Lack of Transparency:** It is difficult to track who has accessed patient data and when.

## Our Solution

Hospital_Chain leverages the power of blockchain to address these challenges:

*   **Patient-Centric Data Ownership:** Patients have full control over their medical records. They can grant or revoke access to doctors and researchers at any time.
*   **Enhanced Security:** All data is encrypted and stored on a decentralized network, making it highly resistant to tampering and unauthorized access.
*   **Seamless Data Sharing:** Our platform provides a secure and efficient way for patients to share their data with healthcare providers and researchers.
*   **Transparent Audit Trails:** Every access to a patient's data is recorded on the blockchain, creating an immutable and transparent audit trail.
*   **Research Marketplace:** We provide a platform for researchers to request access to anonymized patient data for medical studies, while compensating patients for their contribution.

## Getting Started

To set up and run this project locally, follow these steps:

### Prerequisites

*   [Node.js](https://nodejs.org/en/)
*   [DFINITY Canister SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install/)

### 1. Clone the repository

```bash
git clone <repository-url>
cd Hospital_Chain
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the local replica

In a new terminal window, run:

```bash
dfx start --clean
```

### 4. Deploy the canisters

```bash
dfx deploy
```

### 5. Start the frontend development server

In another terminal window, run:

```bash
npm run dev
```

Your application will be running at the URL provided in the terminal.

## Technology Stack

*   **Backend:** Rust, Internet Computer Protocol
*   **Frontend:** React, Vite, Tailwind CSS
*   **Database:** Internet Computer Canisters
