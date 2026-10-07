export interface Topic {
  id: string;
  title: string;
}

export interface Module {
  id: string;
  title: string;
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
    title: "Foundations",
    topics: [
      { id: "m1t1", title: "What is AI, ML and Deep Learning" },
      { id: "m1t2", title: "Python basics for data work" },
      { id: "m1t3", title: "NumPy & Pandas essentials" },
      { id: "m1t4", title: "Linear algebra & probability refresher" },
    ],
  },
  {
    id: "m2",
    title: "Machine Learning",
    topics: [
      { id: "m2t1", title: "Supervised vs unsupervised learning" },
      { id: "m2t2", title: "Regression & classification" },
      { id: "m2t3", title: "Model evaluation & overfitting" },
      { id: "m2t4", title: "scikit-learn hands-on" },
    ],
  },
  {
    id: "m3",
    title: "Deep Learning",
    topics: [
      { id: "m3t1", title: "Neural network fundamentals" },
      { id: "m3t2", title: "Training: loss, gradients, optimizers" },
      { id: "m3t3", title: "CNNs for images" },
      { id: "m3t4", title: "PyTorch basics" },
    ],
  },
  {
    id: "m4",
    title: "LLMs & Generative AI",
    topics: [
      { id: "m4t1", title: "Transformers & attention" },
      { id: "m4t2", title: "Prompt engineering" },
      { id: "m4t3", title: "Embeddings & vector search" },
      { id: "m4t4", title: "Retrieval-Augmented Generation (RAG)" },
      { id: "m4t5", title: "Building agents with tools" },
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
];

export const ALL_TOPIC_IDS = ROADMAP.flatMap((m) => m.topics.map((t) => t.id));
