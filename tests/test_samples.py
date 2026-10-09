"""
Five predefined test samples for StudyForge AI evaluation.
Use these with the Prompt Lab and Evaluation Dashboard to record actual scores.
Run: python tests/test_samples.py to print all samples.
"""

TEST_SAMPLES = [
    {
        "id": "TS-01",
        "topic": "Machine Learning Fundamentals",
        "difficulty": "Beginner",
        "notes": """
Machine Learning (ML) is a branch of Artificial Intelligence (AI) that allows computers to learn
from data without being explicitly programmed. Instead of following hard-coded rules, ML algorithms
identify patterns in data and improve their performance over time.

Types of Machine Learning:
1. Supervised Learning: The algorithm learns from labeled training data. Examples: spam detection, image classification.
2. Unsupervised Learning: The algorithm finds hidden patterns in unlabeled data. Examples: customer segmentation, topic modeling.
3. Reinforcement Learning: An agent learns by interacting with an environment and receiving rewards or penalties.

Key Concepts:
- Training Data: The dataset used to train the model.
- Features: Input variables (columns) used to make predictions.
- Labels: The output variable the model tries to predict (in supervised learning).
- Model: A mathematical function that maps inputs to outputs.
- Overfitting: When a model performs well on training data but poorly on new data.
- Underfitting: When a model is too simple to capture the underlying pattern.

The Bias-Variance Tradeoff:
- High Bias: The model makes strong assumptions, leading to underfitting.
- High Variance: The model is too sensitive to training data, leading to overfitting.
- The goal is to find a balance that generalizes well.

Common ML Algorithms:
- Linear Regression (predicting continuous values)
- Logistic Regression (binary classification)
- Decision Trees
- Random Forests
- Support Vector Machines (SVM)
- Neural Networks
        """.strip()
    },
    {
        "id": "TS-02",
        "topic": "Photosynthesis",
        "difficulty": "Intermediate",
        "notes": """
Photosynthesis is the biochemical process by which plants, algae, and some bacteria convert light energy,
usually from the sun, into chemical energy stored in glucose. The overall reaction is:
6CO2 + 6H2O + light energy → C6H12O6 + 6O2

Location: Photosynthesis occurs in the chloroplasts of plant cells.
The chloroplast has two main compartments:
1. Thylakoid membrane — site of the light-dependent reactions
2. Stroma — site of the light-independent reactions (Calvin Cycle)

Light-Dependent Reactions (in thylakoid membrane):
- Chlorophyll absorbs sunlight (mainly red and blue wavelengths; reflects green).
- Water molecules are split (photolysis): 2H2O → 4H+ + 4e- + O2
- ATP and NADPH are produced.
- Oxygen is released as a byproduct.
- Two photosystems: Photosystem II (P680) and Photosystem I (P700).

Calvin Cycle / Light-Independent Reactions (in stroma):
- Uses ATP and NADPH from light reactions.
- CO2 is fixed by the enzyme RuBisCO.
- Three stages: Carbon Fixation, Reduction, and Regeneration of RuBP.
- Produces G3P (glyceraldehyde-3-phosphate), which is used to make glucose.

Factors Affecting Photosynthesis:
- Light intensity
- CO2 concentration
- Temperature
- Water availability
- Chlorophyll content
        """.strip()
    },
    {
        "id": "TS-03",
        "topic": "The French Revolution",
        "difficulty": "Intermediate",
        "notes": """
The French Revolution (1789–1799) was a period of radical political and societal change in France.
It overthrew the monarchy, established a republic, and culminated in Napoleon Bonaparte's rise to power.

Causes:
1. Financial crisis: France was nearly bankrupt due to wars (including support for the American Revolution).
2. Social inequality: The Estates system divided society into clergy (1st Estate), nobility (2nd Estate),
   and commoners (3rd Estate). The 3rd Estate bore most taxation.
3. Enlightenment ideas: Philosophers like Rousseau and Voltaire promoted liberty, equality, and popular sovereignty.
4. Food shortage: Poor harvests led to bread shortages and rising prices.

Key Events:
- 1789: Storming of the Bastille (July 14) — symbol of the revolution.
- 1789: Declaration of the Rights of Man and Citizen proclaimed.
- 1791: Constitutional monarchy established.
- 1792: First French Republic declared.
- 1793–1794: Reign of Terror — radical phase; thousands executed by guillotine under Robespierre.
- 1799: Napoleon's coup (18 Brumaire) — end of the Revolution.

Legacy:
- Spread ideals of liberté, égalité, fraternité (liberty, equality, fraternity).
- Influenced revolutions across Europe and Latin America.
- Led to the Napoleonic Wars and reshaping of European borders.
        """.strip()
    },
    {
        "id": "TS-04",
        "topic": "Prompt Engineering",
        "difficulty": "Advanced",
        "notes": """
Prompt engineering is the practice of designing and optimizing input prompts to effectively communicate
with large language models (LLMs) to elicit accurate, relevant, and useful responses.

Core Prompting Techniques:
1. Zero-Shot Prompting: Asking the model to complete a task without any examples.
2. Few-Shot Prompting: Providing a few input-output examples before the actual query.
3. Chain-of-Thought (CoT): Encouraging the model to reason step-by-step before answering.
4. Self-Consistency: Generating multiple reasoning paths and selecting the most consistent answer.
5. Instruction Tuning: Fine-tuning models on instruction-response pairs.
6. ReAct Prompting: Combining reasoning and acting (tool use) in a single prompt.

Key Prompt Design Principles:
- Clarity: Be explicit about the task, format, and constraints.
- Context: Provide relevant background information.
- Role assignment: "You are an expert in..." primes the model's persona.
- Output format specification: Request JSON, bullet points, numbered lists, etc.
- Constraint-setting: Limit length, prohibit hallucination, specify tone.

Failure Modes in Prompting:
- Hallucination: Model generates plausible but factually incorrect information.
- Prompt injection: Malicious inputs that override system instructions.
- Sycophancy: Model agrees with the user's incorrect claims.
- Context overflow: Input exceeds context window, losing early information.

Evaluation Metrics for Prompt Quality:
- Factual Accuracy: Does the output match ground truth?
- Relevance: Is the output on-topic?
- Completeness: Does it address all parts of the prompt?
- Consistency: Are multiple runs consistent?
- Coherence: Is the output logically structured?

Advanced Techniques:
- Automatic Prompt Optimization (APO): Using LLMs to improve prompts automatically.
- Prompt chaining: Output of one prompt feeds into the next.
- Constitutional AI: Using a set of principles to self-critique and revise outputs.
        """.strip()
    },
    {
        "id": "TS-05",
        "topic": "Database Normalization",
        "difficulty": "Advanced",
        "notes": """
Database normalization is the process of organizing a relational database to reduce data redundancy
and improve data integrity. It involves decomposing tables into smaller ones and defining relationships.

Normal Forms (NF):
1NF (First Normal Form):
- Each column contains atomic (indivisible) values.
- Each column has a unique name.
- Each row is unique (primary key exists).

2NF (Second Normal Form):
- Must be in 1NF.
- Every non-key attribute must be fully functionally dependent on the entire primary key.
- Eliminates partial dependencies (relevant when composite primary keys exist).

3NF (Third Normal Form):
- Must be in 2NF.
- No transitive dependency: non-key attributes must not depend on other non-key attributes.
- Every attribute must depend only on the primary key.

BCNF (Boyce-Codd Normal Form):
- A stronger version of 3NF.
- For every non-trivial functional dependency X → Y, X must be a superkey.
- Resolves anomalies that 3NF may miss in rare cases.

4NF (Fourth Normal Form):
- Must be in BCNF.
- No multi-valued dependencies except on a superkey.

Update Anomalies (avoided by normalization):
- Insertion Anomaly: Cannot insert data without inserting unrelated data.
- Update Anomaly: Changing a value requires updating multiple rows.
- Deletion Anomaly: Deleting a row unintentionally removes other facts.

Denormalization:
- Intentionally introducing redundancy for performance gains.
- Common in data warehouses and OLAP systems where read performance matters more.
- Trade-off: faster queries vs. data inconsistency risk.

Functional Dependencies:
- A → B: Knowing A determines B.
- Closure of a set of FDs determines all derivable dependencies.
- Armstrong's Axioms: Reflexivity, Augmentation, Transitivity.
        """.strip()
    },
]


if __name__ == "__main__":
    for s in TEST_SAMPLES:
        print(f"\n{'='*60}")
        print(f"ID:         {s['id']}")
        print(f"Topic:      {s['topic']}")
        print(f"Difficulty: {s['difficulty']}")
        print(f"Length:     {len(s['notes'])} chars")
        print(f"Preview:    {s['notes'][:120]}...")
