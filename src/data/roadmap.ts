export interface Topic {
  id: string;
  title: string;
}

export interface Module {
  id: string;
  title: string;
  duration: string;
  topics: Topic[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
}

export const ROADMAP: Module[] = [
  {
    id: "m1",
    title: "Python Foundations",
    duration: "1 week",
    topics: [
      { id: "m1t2", title: "Python setup, syntax, variables, and data types" },
      { id: "m1t5", title: "Control flow, collections, and comprehensions" },
      { id: "m1t6", title: "Functions, modules, files, and error handling" },
      {
        id: "m1t9",
        title: "Git and GitHub basics for saving and sharing work",
      },
      { id: "m1t3", title: "Working with data using NumPy and Pandas" },
      { id: "m1t7", title: "Mini project: CLI task tracker with file storage" },
      {
        id: "m1t8",
        title: "Mini project: explore and summarize a small dataset",
      },
    ],
  },
  {
    id: "m2",
    title: "Basic Machine Learning",
    duration: "2 weeks",
    topics: [
      { id: "m1t1", title: "AI vs ML vs Deep Learning: the basic concepts" },
      {
        id: "m1t4",
        title: "Essential math intuition: vectors, probability, and statistics",
      },
      { id: "m2t1", title: "Supervised vs unsupervised learning" },
      { id: "m2t2", title: "Regression & classification" },
      {
        id: "m2t3",
        title: "Train/test split, model evaluation, and overfitting",
      },
      { id: "m2t4", title: "Train a baseline model with scikit-learn" },
      {
        id: "m2t5",
        title: "Mini project: predict an outcome from tabular data",
      },
    ],
  },
  {
    id: "m3",
    title: "Basic Deep Learning",
    duration: "2 weeks",
    topics: [
      { id: "m3t1", title: "Neural network fundamentals" },
      { id: "m3t2", title: "Tensors, loss, training loops, and optimizers" },
      { id: "m3t3", title: "Build a simple CNN for image classification" },
      { id: "m3t4", title: "PyTorch basics" },
      {
        id: "m3t5",
        title: "Mini project: train and explain a small image classifier",
      },
    ],
  },
  {
    id: "m4",
    title: "Generative AI in Depth",
    duration: "3 weeks",
    topics: [
      {
        id: "m4t1",
        title: "LLMs, tokens, context windows, and transformer intuition",
      },
      { id: "m4t2", title: "Prompt patterns and structured outputs" },
      { id: "m4t6", title: "Use an LLM API: keys, limits, and error handling" },
      { id: "m4t3", title: "Embeddings and vector search" },
      {
        id: "m4t4",
        title: "RAG: chunking, retrieval, citations, and evaluation",
      },
      { id: "m4t7", title: "Check quality, hallucinations, privacy, and cost" },
      { id: "m4t8", title: "Project: chat with your own documents using RAG" },
    ],
  },
  {
    id: "m5",
    title: "AI Agents",
    duration: "2 weeks",
    topics: [
      { id: "m4t5", title: "Agent loop and tool calling" },
      { id: "m5t1", title: "Build a bounded multi-step workflow" },
      { id: "m5t2", title: "State, memory, and context" },
      { id: "m5t3", title: "Guardrails, human approval, and failure handling" },
      { id: "m5t4", title: "Test an agent with tasks and expected outcomes" },
      { id: "m5t5", title: "Capstone: an agent that solves one useful task" },
      {
        id: "m5t6",
        title: "Deploy and document your capstone",
      },
    ],
  },
  {
    id: "m6",
    title: "Revision & Showcase",
    duration: "1 week",
    topics: [
      { id: "m6t1", title: "Revisit difficult or unfinished roadmap topics" },
      { id: "m6t2", title: "Polish one project using peer feedback" },
      { id: "m6t3", title: "Prepare a README and project demo" },
      {
        id: "m6t4",
        title: "Present your work and reflect on what you learned",
      },
    ],
  },
];

export const PROJECTS: Project[] = [
  {
    id: "p1",
    title: "House price predictor",
    description: "Regression model with scikit-learn.",
  },
  {
    id: "p2",
    title: "Image classifier",
    description: "Train a small CNN on a public dataset.",
  },
  {
    id: "p3",
    title: "Chat with your docs",
    description: "RAG demo over a few PDFs.",
  },
  {
    id: "p4",
    title: "Mini AI agent",
    description: "An LLM agent that calls a simple tool.",
  },
  {
    id: "p5",
    title: "Python task tracker",
    description: "Build a small command-line app that saves and loads tasks.",
  },
  {
    id: "p6",
    title: "Python data exploration",
    description: "Use Pandas to explore a dataset and explain a few findings.",
  },
];

export const ALL_TOPIC_IDS = ROADMAP.flatMap((m) => m.topics.map((t) => t.id));
