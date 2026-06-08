# EduFlow UML Documentation

**Aim of the Project:**
To design, model, and document the essential Unified Modeling Language (UML) diagrams—Use Case, Class, Sequence, Activity, Component, and Deployment—for the EduFlow academic portal in order to visualize its system requirements, static structure, dynamic behavior, and physical deployment architecture.

---

## 1. Use Case Diagram
**Procedure:**
1. Open the UML modeling tool (e.g., StarUML) and create a new **Use Case Diagram**.
2. Define the System Boundary to represent the scope of the EduFlow platform.
3. Identify and add the primary actors: **Student**, **Faculty**, and **Administrator**.
4. Identify and add the core use cases (e.g., *Login*, *Manage Attendance*, *Take Quiz*, *Manage Users*, *View Dashboard*).
5. Draw association lines connecting each actor to their respective use cases.
6. Apply `<<include>>` relationships for mandatory common behaviors (e.g., *Login* is included in all dashboard actions) and `<<extend>>` for optional flows.
7. Save the model and export the diagram.

**Result:**
The Use Case diagram representing the actors and their interaction boundaries within the EduFlow system was successfully designed and modeled.

---

## 2. Class Diagram
**Procedure:**
1. Create a new **Class Diagram** in the modeling tool.
2. Identify the core entities from the system's data model (e.g., `User`, `Student`, `Faculty`, `Course`, `Attendance`, `Assessment`).
3. Create a class shape for each entity.
4. Add relevant **Attributes** (e.g., `email: String`, `role: String`) with proper visibility modifiers (private/public).
5. Add relevant **Methods/Operations** (e.g., `login()`, `markAttendance()`, `submitQuiz()`).
6. Establish relationships such as Association, Aggregation, and Composition between the classes.
7. Define the multiplicity constraints (e.g., `1..*`, `0..1`) for each relationship to indicate data cardinality.
8. Save the model and export the diagram.

**Result:**
The Class diagram illustrating the static structure, entities, and object-oriented design of the EduFlow platform was successfully designed and modeled.

---

## 3. Sequence Diagram
**Procedure:**
1. Create a new **Sequence Diagram** in the modeling tool.
2. Identify the participating objects/actors for a specific scenario (e.g., Submitting a Quiz) and place them at the top of the diagram as **Lifelines**.
3. Draw vertical dashed lines descending from each object to represent their lifespan during the interaction.
4. Add **Execution Specifications (Activation boxes)** on the lifelines to show when an object is actively processing.
5. Draw directed solid arrows between lifelines to represent synchronous **Messages/Method Calls** in chronological order from top to bottom.
6. Use dashed arrows to represent **Return Messages** indicating the flow of data back to the caller.
7. Add combined fragments (e.g., `alt` or `opt`) to represent conditional logic.
8. Save the model and export the diagram.

**Result:**
The Sequence diagram detailing the time-ordered sequence of interactions and method calls for key EduFlow operations was successfully designed and modeled.

---

## 4. Activity Diagram
**Procedure:**
1. Create a new **Activity Diagram** in the modeling tool.
2. Place an **Initial Node** (solid circle) to represent the starting point of the workflow.
3. Add **Action States (Activities)** to represent the sequential steps in the process (e.g., *Enter Credentials*, *Validate User*, *Load Dashboard*).
4. Connect the activities using **Control Flows** (directed arrows) to define the execution sequence.
5. Insert **Decision Nodes** (diamond shapes) to represent branching logic (e.g., *Are credentials valid?*).
6. Draw multiple outgoing flows from decision nodes with corresponding **Guard Conditions** (e.g., `[Valid]`, `[Invalid]`).
7. Use **Fork** and **Join** nodes (thick black bars) if there are parallel processes occurring simultaneously.
8. Place a **Final Node** (bullseye) to denote the completion of the workflow.
9. Save the model and export the diagram.

**Result:**
The Activity diagram mapping out the procedural flow of control, decisions, and business logic in the EduFlow platform was successfully designed and modeled.

---

## 5. Component Diagram
**Procedure:**
1. Create a new **Component Diagram** in the modeling tool.
2. Identify the major functional modules of the MERN stack system (e.g., *React Frontend UI*, *Node.js API Gateway*, *Auth Service*, *MongoDB Database*).
3. Represent each module as a **Component** (rectangle with the component icon).
4. Define the interfaces provided and required by these components using the **Lollipop/Socket** notation or `<<provide>>`/`<<require>>` stereotypes.
5. Draw **Dependency Arrows** indicating how components rely on one another (e.g., the Frontend component depends on the API Gateway component).
6. Save the model and export the diagram.

**Result:**
The Component diagram illustrating the physical software structure, modules, and their interdependencies within the EduFlow architecture was successfully designed and modeled.

---

## 6. Deployment Diagram
**Procedure:**
1. Create a new **Deployment Diagram** in the modeling tool.
2. Identify the physical or virtual hardware elements (Nodes) in the production environment (e.g., *Client Device*, *Web Server*, *Application Server*, *Database Server*).
3. Represent each piece of hardware as a **Node** (3D box).
4. Place the executable software **Artifacts** or **Components** inside their respective Nodes to show where they are hosted (e.g., placing the React Build artifact inside the Web Server node, and MongoDB inside the Database node).
5. Draw **Communication Paths** (solid lines) between the nodes to represent network connections.
6. Annotate the communication paths with the network protocols used (e.g., `<<HTTPS>>`, `<<TCP/IP>>`).
7. Save the model and export the diagram.

**Result:**
The Deployment diagram illustrating the physical hardware nodes, network connections, and the runtime execution architecture of the EduFlow platform was successfully designed and modeled.
