# 🛠️ MiniLambda

<div align="center">
  <img src="./frontend/public/babylambda.svg" width="40%;" alt="QuickKanban logo"/>
</div>

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white&style=for-the-badge)](https://nodejs.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white&style=for-the-badge)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-FF0000?style=for-the-badge)](https://docs.bullmq.io/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?logo=express&style=for-the-badge)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4ea94b?logo=mongodb&logoColor=white&style=for-the-badge)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-black?logo=socket.io&style=for-the-badge)](https://socket.io/)
[![React](https://img.shields.io/badge/React-20232a?logo=react&logoColor=61dafb&style=for-the-badge)](https://reactjs.org/)
[![Chakra UI](https://img.shields.io/badge/Chakra%20UI-319795?logo=chakraui&logoColor=white&style=for-the-badge)](https://chakra-ui.com/)

</div>

## Overview

A job orchestrator allowing developers to submit multi-step, multi-model, dependency-based AI/LLM job pipelines. After the entire pipeline is executed, a report is generated about the overall success or failure of the pipeline, as well as each job's results.

## Features

- DAG-based pipeline execution
- Redis-backed job queue with BullMQ
- MongoDB-powered job reporting
- Status tracking (success, failure, skipped)
- Extensible architecture for custom job types

## Architecture

![MiniLambda Architecture](./architecture.png)
