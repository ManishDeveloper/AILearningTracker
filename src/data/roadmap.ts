export type RoadmapItemType = "topic" | "project";

export interface Topic {
  id: string;
  title: string;
  points: number;
  type: RoadmapItemType;
}

export interface Module {
  id: string;
  title: string;
  duration: string;
  topics: Topic[];
}

export const ROADMAP: Module[] = [
  {
    id: "m1",
    title: "Python for AI",
    duration: "1 week",
    topics: [
      {
        id: "m1t1",
        title: "Python syntax, data types, and control flow (quick refresh)",
        points: 10,
        type: "topic",
      },
      {
        id: "m1t2",
        title: "Collections, comprehensions, and data transformations",
        points: 15,
        type: "topic",
      },
      {
        id: "m1t3",
        title: "Functions, lambda expressions, and functional patterns",
        points: 10,
        type: "topic",
      },
      {
        id: "m1t4",
        title: "Exception handling, files, JSON, and environment variables",
        points: 15,
        type: "topic",
      },
      {
        id: "m1t5",
        title: "NumPy fundamentals and array operations",
        points: 15,
        type: "topic",
      },
      {
        id: "m1t6",
        title: "Pandas fundamentals and DataFrame operations",
        points: 15,
        type: "topic",
      },
      {
        id: "m1t7",
        title: "Loading, cleaning, and transforming datasets",
        points: 20,
        type: "topic",
      },
      {
        id: "m1t8",
        title: "Python async basics and making HTTP/API requests",
        points: 20,
        type: "topic",
      },
      {
        id: "m1t9",
        title: "Mini-project: Build a Python data analysis utility",
        points: 150,
        type: "project",
      },
    ],
  },
  {
    id: "m2",
    title: "ML + DL Essentials",
    duration: "1–2 weeks",
    topics: [
      {
        id: "m2t1",
        title: "AI vs Machine Learning vs Deep Learning",
        points: 10,
        type: "topic",
      },
      {
        id: "m2t2",
        title: "Datasets, features, labels, and training data",
        points: 10,
        type: "topic",
      },
      {
        id: "m2t3",
        title: "Supervised vs unsupervised learning",
        points: 10,
        type: "topic",
      },
      {
        id: "m2t4",
        title: "Training, validation, test data, and data leakage",
        points: 15,
        type: "topic",
      },
      {
        id: "m2t5",
        title: "Regression and classification: core concepts",
        points: 15,
        type: "topic",
      },
      {
        id: "m2t6",
        title: "Model evaluation, overfitting, and generalization",
        points: 20,
        type: "topic",
      },
      {
        id: "m2t7",
        title: "Mini-project: Train and evaluate a simple ML model",
        points: 175,
        type: "project",
      },
      {
        id: "m2t8",
        title: "Neural networks: neurons, layers, weights, and biases",
        points: 15,
        type: "topic",
      },
      {
        id: "m2t9",
        title: "Activation functions, loss functions, and optimizers",
        points: 20,
        type: "topic",
      },
      {
        id: "m2t10",
        title: "Forward propagation and backpropagation (conceptual)",
        points: 20,
        type: "topic",
      },
      {
        id: "m2t11",
        title: "Tensors, training loops, and PyTorch fundamentals",
        points: 25,
        type: "topic",
      },
      {
        id: "m2t12",
        title: "Transformers and attention: high-level introduction",
        points: 30,
        type: "topic",
      },
    ],
  },
  {
    id: "m3",
    title: "Generative AI",
    duration: "3 weeks",
    topics: [
      {
        id: "m3t1",
        title: "Generative AI fundamentals and common use cases",
        points: 10,
        type: "topic",
      },
      {
        id: "m3t2",
        title: "LLMs: how they work, capabilities, and limitations",
        points: 25,
        type: "topic",
      },
      {
        id: "m3t3",
        title: "Tokens, tokenization, and context windows",
        points: 20,
        type: "topic",
      },
      {
        id: "m3t4",
        title: "Embeddings and semantic similarity",
        points: 30,
        type: "topic",
      },
      {
        id: "m3t5",
        title: "Transformer architecture and attention mechanism",
        points: 35,
        type: "topic",
      },
      {
        id: "m3t6",
        title: "Prompt engineering, instructions, and prompt patterns",
        points: 20,
        type: "topic",
      },
      {
        id: "m3t7",
        title: "System prompts, message roles, and conversation history",
        points: 15,
        type: "topic",
      },
      {
        id: "m3t8",
        title: "Structured outputs, JSON schemas, and validation",
        points: 25,
        type: "topic",
      },
      {
        id: "m3t9",
        title: "LLM APIs: streaming, retries, errors, and rate limits",
        points: 30,
        type: "topic",
      },
      {
        id: "m3t10",
        title: "FastAPI: expose an LLM feature through a REST API",
        points: 30,
        type: "topic",
      },
      {
        id: "m3t11",
        title: "Function calling and external tool integration",
        points: 35,
        type: "topic",
      },
      {
        id: "m3t12",
        title: "Vector databases and similarity search",
        points: 30,
        type: "topic",
      },
      {
        id: "m3t13",
        title: "RAG architecture: ingestion, retrieval, and generation",
        points: 35,
        type: "topic",
      },
      {
        id: "m3t14",
        title: "Document chunking, metadata, retrieval, and reranking",
        points: 35,
        type: "topic",
      },
      {
        id: "m3t15",
        title:
          "RAG evaluation: retrieval quality, relevance, and grounded answers",
        points: 40,
        type: "topic",
      },
      {
        id: "m3t16",
        title:
          "LLM evaluation: test cases, output quality, and regression tests",
        points: 35,
        type: "topic",
      },
      {
        id: "m3t17",
        title: "Hallucinations, prompt injection, privacy, and security basics",
        points: 35,
        type: "topic",
      },
      {
        id: "m3t18",
        title: "Model selection, cost, latency, caching, and reliability",
        points: 30,
        type: "topic",
      },
      {
        id: "m3t19",
        title: "Observability: logging, tracing, and debugging LLM requests",
        points: 30,
        type: "topic",
      },
      {
        id: "m3t20",
        title: "Mini-project: Build a structured-output LLM application",
        points: 150,
        type: "project",
      },
      {
        id: "m3t21",
        title:
          "Mini-project: Build a RAG app that answers questions about PDFs",
        points: 250,
        type: "project",
      },
    ],
  },
  {
    id: "m4",
    title: "AI Agents",
    duration: "3 weeks",
    topics: [
      {
        id: "m4t1",
        title: "AI agents: concepts, capabilities, and limitations",
        points: 15,
        type: "topic",
      },
      {
        id: "m4t2",
        title: "Agents vs chatbots vs deterministic workflows",
        points: 20,
        type: "topic",
      },
      {
        id: "m4t3",
        title: "The agent loop: observe, reason, act, and repeat",
        points: 30,
        type: "topic",
      },
      {
        id: "m4t4",
        title: "Tools, function calling, and external API integration",
        points: 30,
        type: "topic",
      },
      {
        id: "m4t5",
        title: "Planning, task decomposition, and multi-step execution",
        points: 35,
        type: "topic",
      },
      {
        id: "m4t6",
        title: "State, context management, and short-term memory",
        points: 30,
        type: "topic",
      },
      {
        id: "m4t7",
        title: "Workflow orchestration, routing, and conditional execution",
        points: 35,
        type: "topic",
      },
      {
        id: "m4t8",
        title: "LangGraph: nodes, edges, state, and conditional flows",
        points: 40,
        type: "topic",
      },
      {
        id: "m4t9",
        title: "MCP fundamentals: connecting AI applications to tools",
        points: 35,
        type: "topic",
      },
      {
        id: "m4t10",
        title: "Long-term memory, persistence, and checkpointing",
        points: 30,
        type: "topic",
      },
      {
        id: "m4t11",
        title: "Guardrails, permissions, human approval, and failure handling",
        points: 35,
        type: "topic",
      },
      {
        id: "m4t12",
        title: "Prompt injection and secure execution of agent tools",
        points: 35,
        type: "topic",
      },
      {
        id: "m4t13",
        title: "Agent evaluation, tracing, and automated testing",
        points: 35,
        type: "topic",
      },
      {
        id: "m4t14",
        title: "Agent observability, retries, timeouts, and recovery",
        points: 30,
        type: "topic",
      },
      {
        id: "m4t15",
        title: "Multi-agent systems: when to use multiple agents",
        points: 25,
        type: "topic",
      },
      {
        id: "m4t16",
        title: "Production readiness: FastAPI, Docker, and deployment basics",
        points: 40,
        type: "topic",
      },
      {
        id: "m4t17",
        title:
          "Mini-project: Build an agent that uses tools to complete a task",
        points: 250,
        type: "project",
      },
      {
        id: "m4t18",
        title: "Mini-project: Build a stateful workflow with LangGraph",
        points: 275,
        type: "project",
      },
      {
        id: "m4t19",
        title: "Final challenge: Test and deploy a useful AI agent",
        points: 300,
        type: "project",
      },
    ],
  },
];

export const ALL_TOPIC_IDS = ROADMAP.flatMap((module) =>
  module.topics.map((topic) => topic.id),
);
