/**
 * Comprehensive Original Seed Dataset for ExamSphere
 */

const sampleQuestions = [
  // --- DSA: Data Structures & Algorithms ---
  {
    questionText: "What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree (BST)?",
    options: [
      { id: "A", text: "O(log n)" },
      { id: "B", text: "O(n)" },
      { id: "C", text: "O(n log n)" },
      { id: "D", text: "O(1)" }
    ],
    correctAnswer: "B",
    explanation: "In an unbalanced BST (e.g. when elements are inserted in sorted order), the tree degenerates into a linked list of height n, making the worst-case search complexity O(n). A balanced BST (like AVL or Red-Black) guarantees O(log n).",
    subject: "DSA",
    topic: "Binary Trees",
    difficulty: "Easy",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["trees", "bst", "complexity"]
  },
  {
    questionText: "Which algorithm is optimal for finding the shortest path from a single source in a weighted graph with non-negative edge weights?",
    options: [
      { id: "A", text: "Bellman-Ford Algorithm" },
      { id: "B", text: "Floyd-Warshall Algorithm" },
      { id: "C", text: "Dijkstra's Algorithm" },
      { id: "D", text: "Kruskal's Algorithm" }
    ],
    correctAnswer: "C",
    explanation: "Dijkstra's algorithm solves single-source shortest path problems with non-negative edge weights in O((V + E) log V) using a min-heap. Bellman-Ford can handle negative weights but is slower (O(VE)).",
    subject: "DSA",
    topic: "Graphs",
    difficulty: "Medium",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["graphs", "shortest-path", "dijkstra"]
  },
  {
    questionText: "In Dynamic Programming, what two essential properties must an optimization problem exhibit for DP to apply?",
    options: [
      { id: "A", text: "Greedy choice property and deterministic sorting" },
      { id: "B", text: "Optimal substructure and overlapping subproblems" },
      { id: "C", text: "Linear independence and divide-and-conquer" },
      { id: "D", text: "Monotonicity and asymptotic invariance" }
    ],
    correctAnswer: "B",
    explanation: "Dynamic programming applies to problems that have optimal substructure (an optimal solution contains within it optimal solutions to subproblems) and overlapping subproblems (the same subproblems are solved repeatedly).",
    subject: "DSA",
    topic: "Dynamic Programming",
    difficulty: "Medium",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["dp", "optimization", "algorithms"]
  },
  {
    questionText: "What is the time complexity to insert a new key into a binary Min-Heap containing n elements?",
    options: [
      { id: "A", text: "O(1)" },
      { id: "B", text: "O(log n)" },
      { id: "C", text: "O(n)" },
      { id: "D", text: "O(n log n)" }
    ],
    correctAnswer: "B",
    explanation: "Inserting into a binary heap involves placing the element at the next available leaf position and performing sift-up (bubble-up) towards the root, which takes at most O(height) = O(log n) swaps.",
    subject: "DSA",
    topic: "Heaps",
    difficulty: "Easy",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["heap", "priority-queue"]
  },
  {
    questionText: "What is the primary advantage of a Self-Balancing Red-Black Tree over an AVL Tree in write-intensive workloads?",
    options: [
      { id: "A", text: "Red-Black Trees require fewer rotations during insertions and deletions" },
      { id: "B", text: "Red-Black Trees have strictly shorter maximum tree height" },
      { id: "C", text: "Red-Black Trees execute read operations faster" },
      { id: "D", text: "Red-Black Trees consume zero auxiliary pointer memory" }
    ],
    correctAnswer: "A",
    explanation: "AVL trees are more rigidly balanced (height difference at most 1), providing faster lookups but requiring more rotations on updates. Red-Black trees permit slightly looser balance, requiring at most 2 rotations on insert and 3 on delete, making them faster for write-heavy workloads.",
    subject: "DSA",
    topic: "Binary Trees",
    difficulty: "Hard",
    marks: 2,
    negativeMarks: 0.5,
    tags: ["trees", "red-black", "avl"]
  },
  {
    questionText: "Which of the following sorting algorithms is stable and achieves an optimal worst-case time complexity of O(n log n)?",
    options: [
      { id: "A", text: "Quicksort" },
      { id: "B", text: "Heapsort" },
      { id: "C", text: "Merge Sort" },
      { id: "D", text: "Selection Sort" }
    ],
    correctAnswer: "C",
    explanation: "Merge Sort guarantees O(n log n) in all cases (worst, average, best) and is stable because equal elements retain their relative order during the merge phase. Standard Quicksort and Heapsort are not stable.",
    subject: "DSA",
    topic: "Sorting",
    difficulty: "Easy",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["sorting", "mergesort", "complexity"]
  },
  {
    questionText: "In a Hash Table with open addressing, what technique helps mitigate both primary and secondary clustering?",
    options: [
      { id: "A", text: "Linear Probing" },
      { id: "B", text: "Quadratic Probing" },
      { id: "C", text: "Double Hashing" },
      { id: "D", text: "Separate Chaining" }
    ],
    correctAnswer: "C",
    explanation: "Double hashing uses a secondary hash function h2(k) as the probe step: (h1(k) + i * h2(k)) mod m. Because the probe sequence depends on the key itself, it avoids both primary clustering (long occupied blocks) and secondary clustering.",
    subject: "DSA",
    topic: "Hash Tables",
    difficulty: "Medium",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["hash", "probing", "data-structures"]
  },
  {
    questionText: "What is the topological sort ordering property in a Directed Acyclic Graph (DAG)?",
    options: [
      { id: "A", text: "For every directed edge (u, v), vertex u appears before vertex v in the ordering" },
      { id: "B", text: "Vertices are ordered strictly in ascending order of their in-degree" },
      { id: "C", text: "Every cycle in the graph is traversed in clockwise orientation" },
      { id: "D", text: "Leaf vertices appear strictly before the graph root" }
    ],
    correctAnswer: "A",
    explanation: "A topological sort of a DAG is a linear ordering of vertices such that for every directed edge (u, v), vertex u precedes vertex v. This represents prerequisite relationships.",
    subject: "DSA",
    topic: "Graphs",
    difficulty: "Medium",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["graphs", "topological-sort", "dag"]
  },

  // --- DBMS: Database Management Systems ---
  {
    questionText: "A relation is in Boyce-Codd Normal Form (BCNF) if and only if for every non-trivial functional dependency X -> Y:",
    options: [
      { id: "A", text: "Y is a subset of X" },
      { id: "B", text: "X is a superkey" },
      { id: "C", text: "Y is a prime attribute" },
      { id: "D", text: "X contains no composite keys" }
    ],
    correctAnswer: "B",
    explanation: "BCNF is a stricter version of 3NF. For any functional dependency X -> Y, X must be a superkey. Unlike 3NF, BCNF does not allow Y to be a prime attribute if X is not a superkey.",
    subject: "DBMS",
    topic: "Normalization",
    difficulty: "Hard",
    marks: 2,
    negativeMarks: 0.5,
    tags: ["normalization", "bcnf", "dependencies"]
  },
  {
    questionText: "Why are B+ Trees widely preferred over Binary Search Trees for secondary storage database indexes?",
    options: [
      { id: "A", text: "B+ Trees minimize disk I/O operations by maintaining high fanout and shallow depth" },
      { id: "B", text: "B+ Trees store full table records inside interior index nodes" },
      { id: "C", text: "B+ Trees do not require balanced tree structures" },
      { id: "D", text: "B+ Trees eliminate the need for write-ahead logging (WAL)" }
    ],
    correctAnswer: "A",
    explanation: "B+ Trees have high fan-out (hundreds of keys per node fitting into disk block pages), keeping height typically <= 3-4. Furthermore, leaf nodes are linked sequentially, enabling rapid range scans.",
    subject: "DBMS",
    topic: "Indexing",
    difficulty: "Medium",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["b+tree", "indexing", "storage"]
  },
  {
    questionText: "In ACID transaction semantics, which property guarantees that database updates persist even in the event of an immediate system crash or power outage?",
    options: [
      { id: "A", text: "Atomicity" },
      { id: "B", text: "Consistency" },
      { id: "C", text: "Isolation" },
      { id: "D", text: "Durability" }
    ],
    correctAnswer: "D",
    explanation: "Durability guarantees that once a transaction commits, its modifications are permanently recorded in non-volatile storage (often through Write-Ahead Logging / WAL) and survive crashes.",
    subject: "DBMS",
    topic: "ACID & Transactions",
    difficulty: "Easy",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["acid", "durability", "transactions"]
  },
  {
    questionText: "What concurrency anomaly does the SQL isolation level REPEATABLE READ prevent that READ COMMITTED does not?",
    options: [
      { id: "A", text: "Dirty Reads" },
      { id: "B", text: "Non-Repeatable (Fuzzy) Reads" },
      { id: "C", text: "Phantom Reads" },
      { id: "D", text: "Lost Updates" }
    ],
    correctAnswer: "B",
    explanation: "READ COMMITTED prevents dirty reads but allows non-repeatable reads (where re-reading a row yields updated values committed by another transaction). REPEATABLE READ locks rows to ensure values read cannot be modified until the transaction ends.",
    subject: "DBMS",
    topic: "ACID & Transactions",
    difficulty: "Medium",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["isolation", "transactions", "concurrency"]
  },
  {
    questionText: "In relational algebra, which join operator preserves all tuples from both the left and right relations regardless of whether a matching predicate is found?",
    options: [
      { id: "A", text: "Inner Join" },
      { id: "B", text: "Left Outer Join" },
      { id: "C", text: "Full Outer Join" },
      { id: "D", text: "Natural Theta Join" }
    ],
    correctAnswer: "C",
    explanation: "A Full Outer Join returns all records when there is a match in either left or right table, padding non-matching column slots with NULL values.",
    subject: "DBMS",
    topic: "Relational Algebra & SQL",
    difficulty: "Easy",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["sql", "joins", "relational-algebra"]
  },
  {
    questionText: "What is the primary functional difference between a Clustered Index and a Non-Clustered Index?",
    options: [
      { id: "A", text: "A clustered index physically determines the on-disk storage order of the actual table rows" },
      { id: "B", text: "A table can contain up to 255 clustered indexes" },
      { id: "C", text: "Non-clustered indexes are strictly prohibited on foreign key columns" },
      { id: "D", text: "Clustered indexes do not support range queries" }
    ],
    correctAnswer: "A",
    explanation: "A table can have only ONE clustered index because it dictates the physical layout of rows on disk. Non-clustered indexes are auxiliary structures containing index keys and pointers back to the row locations.",
    subject: "DBMS",
    topic: "Indexing",
    difficulty: "Medium",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["indexing", "clustered-index"]
  },

  // --- Operating Systems ---
  {
    questionText: "Which of the following is NOT one of the four Coffman conditions necessary for a system Deadlock to occur?",
    options: [
      { id: "A", text: "Mutual Exclusion" },
      { id: "B", text: "Hold and Wait" },
      { id: "C", text: "Preemption Allowed" },
      { id: "D", text: "Circular Wait" }
    ],
    correctAnswer: "C",
    explanation: "The four Coffman conditions are: 1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption (resources cannot be forcibly confiscated), 4. Circular Wait. 'Preemption Allowed' prevents deadlocks.",
    subject: "Operating Systems",
    topic: "Deadlocks",
    difficulty: "Easy",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["deadlock", "coffman", "concurrency"]
  },
  {
    questionText: "In modern virtual memory paging, what hardware component caches recent virtual-to-physical address translations to accelerate lookup times?",
    options: [
      { id: "A", text: "Instruction Register (IR)" },
      { id: "B", text: "Translation Lookaside Buffer (TLB)" },
      { id: "C", text: "Memory Management Unit DMA Controller" },
      { id: "D", text: "Accumulator Cache" }
    ],
    correctAnswer: "B",
    explanation: "The TLB is an on-chip associative hardware cache within the MMU that stores recent virtual-to-physical page mappings. A TLB hit avoids multi-level page table walks in RAM.",
    subject: "Operating Systems",
    topic: "Virtual Memory",
    difficulty: "Medium",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["paging", "tlb", "virtual-memory"]
  },
  {
    questionText: "Belady's Anomaly demonstrates that increasing the number of page frames allocated to a process can paradoxically increase page faults under which replacement algorithm?",
    options: [
      { id: "A", text: "Least Recently Used (LRU)" },
      { id: "B", text: "Optimal Page Replacement (OPT)" },
      { id: "C", text: "First-In First-Out (FIFO)" },
      { id: "D", text: "Clock Replacement Algorithm" }
    ],
    correctAnswer: "C",
    explanation: "Belady's Anomaly occurs in FIFO page replacement because FIFO does not belong to the class of stack algorithms (where the set of pages in an n-frame memory is always a subset of an (n+1)-frame memory).",
    subject: "Operating Systems",
    topic: "Virtual Memory",
    difficulty: "Medium",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["belady", "fifo", "page-replacement"]
  },
  {
    questionText: "What CPU scheduling algorithm guarantees minimal average waiting time for a set of stationary, non-preemptive processes with known burst durations?",
    options: [
      { id: "A", text: "First-Come First-Served (FCFS)" },
      { id: "B", text: "Shortest Job First (SJF)" },
      { id: "C", text: "Round Robin (RR)" },
      { id: "D", text: "Multilevel Feedback Queue (MLFQ)" }
    ],
    correctAnswer: "B",
    explanation: "Shortest Job First (SJF) is mathematically provably optimal in minimizing average process waiting time because scheduling shorter jobs earlier reduces the wait for all subsequent tasks.",
    subject: "Operating Systems",
    topic: "CPU Scheduling",
    difficulty: "Easy",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["scheduling", "sjf", "cpu"]
  },
  {
    questionText: "What synchronization primitive allows multiple threads concurrent read access while restricting write access exclusively to one thread?",
    options: [
      { id: "A", text: "Spinlock" },
      { id: "B", text: "Counting Semaphore" },
      { id: "C", text: "Reader-Writer Lock (RWLock)" },
      { id: "D", text: "Binary Barrier" }
    ],
    correctAnswer: "C",
    explanation: "A Reader-Writer Lock (Shared-Exclusive Lock) enables concurrent reading by multiple threads as long as no writer holds the lock, while writers require mutually exclusive access.",
    subject: "Operating Systems",
    topic: "Synchronization",
    difficulty: "Medium",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["locks", "synchronization", "threads"]
  },

  // --- Computer Networks ---
  {
    questionText: "During the standard TCP 3-way handshake to establish a reliable transport session, what flags are sent across the three exchanges?",
    options: [
      { id: "A", text: "SYN -> SYN-ACK -> ACK" },
      { id: "B", text: "ACK -> SYN -> SYN-ACK" },
      { id: "C", text: "SYN -> FIN -> ACK" },
      { id: "D", text: "RST -> SYN -> ACK" }
    ],
    correctAnswer: "A",
    explanation: "The client sends a SYN packet with initial sequence number x; the server responds with SYN-ACK containing sequence number y and acknowledgment x+1; the client confirms with ACK y+1.",
    subject: "Computer Networks",
    topic: "Transport Layer",
    difficulty: "Easy",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["tcp", "handshake", "protocols"]
  },
  {
    questionText: "In IPv4 subnetting, how many usable host IP addresses are available in a /28 subnet prefix?",
    options: [
      { id: "A", text: "16" },
      { id: "B", text: "14" },
      { id: "C", text: "30" },
      { id: "D", text: "12" }
    ],
    correctAnswer: "B",
    explanation: "A /28 subnet leaves 32 - 28 = 4 host bits. Total addresses = 2^4 = 16. Subtracting the reserved Network Address (all 0s) and Broadcast Address (all 1s) leaves 16 - 2 = 14 usable host IPs.",
    subject: "Computer Networks",
    topic: "IP Addressing & Subnetting",
    difficulty: "Easy",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["ipv4", "cidr", "subnetting"]
  },
  {
    questionText: "Which TCP congestion control phase exponentially increases the congestion window (cwnd) by one MSS for each received ACK?",
    options: [
      { id: "A", text: "Congestion Avoidance" },
      { id: "B", text: "Slow Start" },
      { id: "C", text: "Fast Recovery" },
      { id: "D", text: "TCP BBR Probing" }
    ],
    correctAnswer: "B",
    explanation: "During Slow Start, cwnd begins at 1 MSS and increments by 1 MSS for every received ACK, causing the window size to double every round-trip time (exponential growth) until it reaches ssthresh.",
    subject: "Computer Networks",
    topic: "Congestion Control",
    difficulty: "Medium",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["tcp", "congestion-control", "slow-start"]
  },
  {
    questionText: "At which layer of the OSI reference model do routers primarily operate to perform path determination and packet forwarding?",
    options: [
      { id: "A", text: "Data Link Layer (Layer 2)" },
      { id: "B", text: "Network Layer (Layer 3)" },
      { id: "C", text: "Transport Layer (Layer 4)" },
      { id: "D", text: "Session Layer (Layer 5)" }
    ],
    correctAnswer: "B",
    explanation: "Routers operate at the Network Layer (Layer 3), examining logical IP destination headers to route packets across disparate networks according to routing tables.",
    subject: "Computer Networks",
    topic: "OSI Model & Routing",
    difficulty: "Easy",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["osi", "routing", "network-layer"]
  },
  {
    questionText: "What protocol operates over UDP port 53 to map human-readable domain hostnames to numerical IP addresses?",
    options: [
      { id: "A", text: "DHCP" },
      { id: "B", text: "DNS" },
      { id: "C", text: "SNMP" },
      { id: "D", text: "BGP" }
    ],
    correctAnswer: "B",
    explanation: "Domain Name System (DNS) typically uses UDP port 53 for lightweight, low-latency name resolution queries across distributed hierarchical root, TLD, and authoritative name servers.",
    subject: "Computer Networks",
    topic: "Application Layer Protocols",
    difficulty: "Easy",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["dns", "udp", "protocols"]
  },

  // --- AI & Cloud Engineering ---
  {
    questionText: "In Machine Learning, what technique adds a penalty proportional to the absolute values of the weight coefficients (L1 regularization)?",
    options: [
      { id: "A", text: "Ridge Regression" },
      { id: "B", text: "Lasso Regression" },
      { id: "C", text: "ElasticNet without L1" },
      { id: "D", text: "Batch Normalization" }
    ],
    correctAnswer: "B",
    explanation: "Lasso (Least Absolute Shrinkage and Selection Operator) applies L1 regularization (penalty proportional to |w|). This tends to drive uninformative feature coefficients exactly to zero, performing intrinsic feature selection.",
    subject: "AI Fundamentals",
    topic: "Machine Learning",
    difficulty: "Medium",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["ml", "regularization", "lasso"]
  },
  {
    questionText: "Why does the Vanishing Gradient Problem frequently plague deep neural networks using standard Sigmoid activation functions?",
    options: [
      { id: "A", text: "The maximum derivative of the sigmoid function is 0.25, causing gradients to diminish exponentially through chain rule multiplication" },
      { id: "B", text: "Sigmoids produce unbounded outputs above positive infinity" },
      { id: "C", text: "Sigmoid functions cannot be computed on modern GPUs" },
      { id: "D", text: "Backpropagation is mathematically incompatible with continuous activations" }
    ],
    correctAnswer: "A",
    explanation: "The sigmoid derivative σ'(z) = σ(z)(1-σ(z)) peaks at 0.25. In deep networks, multiplying numbers <= 0.25 across many layers causes the gradient to shrink exponentially toward 0, preventing early layers from learning.",
    subject: "AI Fundamentals",
    topic: "Neural Networks",
    difficulty: "Hard",
    marks: 2,
    negativeMarks: 0.5,
    tags: ["deep-learning", "gradients", "activations"]
  },
  {
    questionText: "According to Brewer's CAP Theorem, what guarantees can a distributed data store simultaneously provide in the presence of a network partition (P)?",
    options: [
      { id: "A", text: "Both Consistency and Availability (CA)" },
      { id: "B", text: "Either Consistency (CP) OR Availability (AP), but not both" },
      { id: "C", text: "Zero network latency and linear scalability" },
      { id: "D", text: "Complete data replication without consensus protocols" }
    ],
    correctAnswer: "B",
    explanation: "In distributed systems where network partitions are inevitable (P), a system must trade off between returning the latest consistent data across all nodes (CP) or remaining available to accept reads and writes on all partitions (AP).",
    subject: "Cloud Architecture",
    topic: "Distributed Systems",
    difficulty: "Medium",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["cap-theorem", "distributed", "system-design"]
  },
  {
    questionText: "Which evaluation metric is most critical when assessing a medical diagnostic model where false negatives carry catastrophic consequences?",
    options: [
      { id: "A", text: "Precision" },
      { id: "B", text: "Recall (Sensitivity)" },
      { id: "C", text: "Specificity" },
      { id: "D", text: "Overall Accuracy" }
    ],
    correctAnswer: "B",
    explanation: "Recall = TP / (TP + FN). When minimizing False Negatives (missing a positive disease condition) is vital, high Recall is required to ensure genuine cases are not overlooked.",
    subject: "AI Fundamentals",
    topic: "Model Evaluation",
    difficulty: "Medium",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["metrics", "recall", "evaluation"]
  },
  {
    questionText: "Which of the following sorting algorithms have a worst-case time complexity of O(n log n)? (Select all that apply)",
    questionType: "MULTIPLE_MCQ",
    options: [
      { id: "A", text: "Merge Sort" },
      { id: "B", text: "Quick Sort" },
      { id: "C", text: "Heap Sort" },
      { id: "D", text: "Bubble Sort" }
    ],
    correctAnswer: "A",
    correctAnswers: ["A", "C"],
    explanation: "Merge Sort and Heap Sort both guarantee O(n log n) worst-case time complexity. Quick Sort is O(n^2) worst case, and Bubble Sort is O(n^2).",
    subject: "DSA",
    topic: "Sorting Algorithms",
    difficulty: "Medium",
    marks: 2,
    negativeMarks: 0.5,
    tags: ["sorting", "complexity", "multi-correct"]
  },
  {
    questionText: "In relational database theory, every relation in Boyce-Codd Normal Form (BCNF) is also in Third Normal Form (3NF).",
    questionType: "TRUE_FALSE",
    options: [
      { id: "T", text: "True" },
      { id: "F", text: "False" }
    ],
    correctAnswer: "T",
    explanation: "True. BCNF is a stricter version of 3NF. Every relation in BCNF is inherently in 3NF, but not all 3NF relations satisfy BCNF.",
    subject: "DBMS",
    topic: "Normalization",
    difficulty: "Medium",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["dbms", "normalization", "bcnf"]
  },
  {
    questionText: "In a classful IPv4 network, what is the maximum number of usable host addresses in a subnet with a /25 CIDR prefix mask?",
    questionType: "NUMERICAL",
    options: [],
    numericalAnswer: 126,
    numericalTolerance: 0,
    correctAnswer: "126",
    explanation: "A /25 network leaves 32 - 25 = 7 bits for hosts. 2^7 = 128 total addresses. Subtracting 2 (network address and broadcast address) gives 126 usable hosts.",
    subject: "Computer Networks",
    topic: "Subnetting",
    difficulty: "Medium",
    marks: 2,
    negativeMarks: 0,
    tags: ["networking", "cidr", "ipv4"]
  },
  {
    questionText: "What protocol operates at the Transport Layer of the OSI model to provide reliable, connection-oriented, full-duplex byte stream transmission?",
    questionType: "FILL_BLANK",
    options: [],
    acceptedAnswers: ["TCP", "Transmission Control Protocol"],
    correctAnswer: "TCP",
    explanation: "Transmission Control Protocol (TCP) provides connection-oriented, reliable, sequence-controlled byte streams with congestion and flow control.",
    subject: "Computer Networks",
    topic: "Transport Layer",
    difficulty: "Easy",
    marks: 1,
    negativeMarks: 0.25,
    tags: ["networking", "tcp", "transport"]
  }
];

module.exports = { sampleQuestions };
