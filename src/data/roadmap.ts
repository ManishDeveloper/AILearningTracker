export interface Topic {
  id: string;
  title: string;
  points: number;
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
    title: "Python Foundations",
    duration: "1 week",
    topics: [
      {
        id: "m1t1",
        title: "Python syntax, variables, data types, and control flow",
        points: 15,
      },
      {
        id: "m1t2",
        title: "Lists, dictionaries, sets, tuples, and comprehensions",
        points: 15,
      },
      {
        id: "m1t3",
        title: "Functions, lambda expressions, and functional patterns",
        points: 15,
      },
      {
        id: "m1t4",
        title: "Exception handling, files, and working with JSON",
        points: 15,
      },
      {
        id: "m1t5",
        title: "NumPy fundamentals and array operations",
        points: 20,
      },
      {
        id: "m1t6",
        title: "Pandas fundamentals and DataFrame operations",
        points: 20,
      },
      {
        id: "m1t7",
        title: "Loading, cleaning, filtering, and transforming datasets",
        points: 25,
      },
    ],
  },
  {
    id: "m2",
    title: "Machine Learning Basics",
    duration: "1 week",
    topics: [
      {
        id: "m2t1",
        title: "AI vs Machine Learning vs Deep Learning",
        points: 10,
      },
      {
        id: "m2t2",
        title: "Datasets, features, labels, and training data",
        points: 15,
      },
      { id: "m2t3", title: "Supervised vs unsupervised learning", points: 15 },
      {
        id: "m2t4",
        title: "Training, validation, and test datasets",
        points: 15,
      },
      { id: "m2t5", title: "Regression and classification", points: 20 },
      { id: "m2t6", title: "Decision trees and ensemble methods", points: 20 },
      {
        id: "m2t7",
        title: "Clustering and unsupervised learning basics",
        points: 15,
      },
      {
        id: "m2t8",
        title: "Model evaluation: accuracy, precision, recall, and F1",
        points: 20,
      },
      {
        id: "m2t9",
        title: "Overfitting, underfitting, and generalization",
        points: 15,
      },
      {
        id: "m2t10",
        title: "Build and evaluate a model with scikit-learn",
        points: 30,
      },
    ],
  },
  {
    id: "m3",
    title: "Deep Learning Basics",
    duration: "1 week",
    topics: [
      {
        id: "m3t1",
        title: "What are neural networks and why do we need them?",
        points: 10,
      },
      { id: "m3t2", title: "Neurons, layers, weights, and biases", points: 15 },
      {
        id: "m3t3",
        title: "Activation functions and their purpose",
        points: 15,
      },
      {
        id: "m3t4",
        title: "Forward propagation and neural network predictions",
        points: 20,
      },
      {
        id: "m3t5",
        title: "Loss functions and model optimization",
        points: 20,
      },
      {
        id: "m3t6",
        title: "Backpropagation — conceptual understanding",
        points: 20,
      },
      {
        id: "m3t7",
        title: "Tensors, datasets, and training loops",
        points: 20,
      },
      {
        id: "m3t8",
        title: "CNN fundamentals and image classification",
        points: 20,
      },
      { id: "m3t9", title: "PyTorch fundamentals", points: 25 },
      {
        id: "m3t10",
        title: "Transformers — high-level introduction",
        points: 30,
      },
    ],
  },
  {
    id: "m4",
    title: "Generative AI",
    duration: "3 weeks",
    topics: [
      {
        id: "m4t1",
        title:
          "What is Generative AI and how is it different from traditional AI?",
        points: 10,
      },
      {
        id: "m4t2",
        title: "Large Language Models and how they work",
        points: 25,
      },
      {
        id: "m4t3",
        title: "Tokens, tokenization, and token limits",
        points: 20,
      },
      {
        id: "m4t4",
        title: "Embeddings and semantic representations",
        points: 30,
      },
      {
        id: "m4t5",
        title: "Transformer architecture and attention mechanism",
        points: 40,
      },
      {
        id: "m4t6",
        title: "Context windows and context management",
        points: 20,
      },
      {
        id: "m4t7",
        title: "Prompt engineering and effective prompt patterns",
        points: 25,
      },
      {
        id: "m4t8",
        title: "System prompts, user prompts, and message roles",
        points: 15,
      },
      {
        id: "m4t9",
        title: "Structured outputs and JSON responses",
        points: 20,
      },
      {
        id: "m4t10",
        title: "Working with LLM APIs, streaming, errors, and retries",
        points: 30,
      },
      { id: "m4t11", title: "Function calling and tool usage", points: 35 },
      {
        id: "m4t12",
        title: "Vector databases and similarity search",
        points: 35,
      },
      { id: "m4t13", title: "RAG fundamentals and architecture", points: 35 },
      {
        id: "m4t14",
        title: "Document ingestion, chunking, and retrieval",
        points: 35,
      },
      {
        id: "m4t15",
        title: "RAG evaluation, grounding, and hallucination control",
        points: 40,
      },
      {
        id: "m4t16",
        title:
          "LLM cost, latency, model selection, and production considerations",
        points: 30,
      },
    ],
  },
  {
    id: "m5",
    title: "AI Agents",
    duration: "2 weeks",
    topics: [
      { id: "m5t1", title: "What is an AI Agent?", points: 15 },
      { id: "m5t2", title: "Agent vs chatbot vs workflow", points: 20 },
      {
        id: "m5t3",
        title: "The agent loop: observe, reason, act, and repeat",
        points: 30,
      },
      {
        id: "m5t4",
        title: "Tools and function calling for agents",
        points: 30,
      },
      {
        id: "m5t5",
        title: "Planning and multi-step task execution",
        points: 35,
      },
      { id: "m5t6", title: "State, context, and memory", points: 35 },
      {
        id: "m5t7",
        title: "Agent workflows and orchestration patterns",
        points: 35,
      },
      { id: "m5t8", title: "LangChain and LangGraph fundamentals", points: 35 },
      {
        id: "m5t9",
        title: "MCP fundamentals and connecting agents to tools",
        points: 40,
      },
      {
        id: "m5t10",
        title: "Guardrails, human-in-the-loop, and failure handling",
        points: 35,
      },
      { id: "m5t11", title: "Agent evaluation and testing", points: 35 },
      {
        id: "m5t12",
        title: "Multi-agent systems — basic concepts",
        points: 30,
      },
      { id: "m5t13", title: "Deploying an AI agent", points: 40 },
    ],
  },
];

export const ALL_TOPIC_IDS = ROADMAP.flatMap((m) => m.topics.map((t) => t.id));
