# FragmentCloud API

[![Docker Containerized](https://img.shields.io/badge/docker-containerized-blue.svg)](https://www.docker.com/)
[![AWS Infrastructure](https://img.shields.io/badge/AWS-Hosted-FF9900.svg)](https://aws.amazon.com/)

## Project Overview

A highly available, containerized RESTful API microservice engineered for secure data fragment ingestion and cloud storage. Developed as a comprehensive cloud computing capstone, this project demonstrates proficiency in cloud-native architecture, distributed systems, and modern DevOps practices. The system securely manages authenticated data payloads, routing them through an AWS-hosted infrastructure with automated deployment pipelines.

## Technical Architecture & Technology Stack

This system leverages a decoupled, stateless architecture designed for horizontal scalability behind an Elastic Load Balancer.

*   **Identity & Access Management:** AWS Cognito (OAuth 2.0)
    *   Implements JWT-based authentication and route-level authorization.
*   **Blob Storage:** AWS S3
    *   Handles highly durable, scalable storage of raw payload fragments.
*   **NoSQL Database:** AWS DynamoDB
    *   Stores fragment metadata, relational mappings, and file attachment records for rapid, low-latency querying.
*   **Compute & Orchestration:** Docker & AWS Elastic Load Balancing (ELB)
    *   The backend API is fully containerized and hosted on a custom AWS domain. Traffic is distributed across instances via an ELB to maintain high availability and fault tolerance.
*   **Continuous Integration / Continuous Deployment (CI/CD):**
    *   Automated pipelines triggered on repository push events. The pipeline handles syntax linting, automated test execution, Docker image construction, and seamless deployment to the AWS production environment.
*   **Observability:**
    *   Structured application-level logging integrated across all endpoints for operational monitoring, performance tracking, and debugging.

## Key Engineering Achievements

*   **Stateless Containerization:** Packaged the application into lightweight Docker containers, ensuring parity across local development, testing, and production environments while enabling rapid horizontal scaling.
*   **Robust Security Posture:** Enforced secure API endpoints requiring valid Cognito-issued JWTs for all data mutation and retrieval operations, ensuring strict tenant isolation.
*   **Storage Optimization:** Designed a multi-tier storage strategy, offloading heavy binary data to S3 while retaining sub-millisecond query performance for unstructured metadata via DynamoDB.
*   **Automated Quality Assurance:** Maintained rigorous code quality with strict pipeline enforcement, incorporating comprehensive unit testing for isolated business logic and full integration testing for AWS service interactions.
