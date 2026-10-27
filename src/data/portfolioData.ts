/**
 * Centralized Portfolio Content & Architectural Configuration
 * Edit this file to update titles, descriptions, technologies, links, statuses, and 3D visual parameters.
 */

export interface ProjectArchitectureStep {
  stage: string;
  title: string;
  detail: string;
}

export interface PortfolioProject {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  extendedOverview: string;
  technologies: string[];
  status: string;
  statusNote: string;
  visualDirection: string;
  dioramaType: 'warehouse' | 'gps' | 'sap' | 'inventory' | 'tasks';
  accentHex: string;
  architectureFlow: ProjectArchitectureStep[];
  keyCapabilities: string[];
  repositoryUrl?: string;
  caseStudyAnchor: string;
}

export interface TechnicalCapability {
  id: string;
  title: string;
  category:
    | 'Enterprise & Operations'
    | 'Backend & Data Architecture'
    | 'Frontend & Interface'
    | 'Automation & Tooling';
  summary: string;
  operationalApplication: string;
  connectedCapabilities: string[];
  relatedProjectIds: string[];
  coordinates: { x: number; y: number; z: number };
}

export interface ExperiencePillar {
  index: string;
  title: string;
  principle: string;
  description: string;
  operationalShift: {
    from: string;
    to: string;
  };
}

export interface SceneWaypoint {
  id: string;
  number: string;
  label: string;
  cameraPos: [number, number, number];
  lookAt: [number, number, number];
  accentColor: string;
  fogDensity: number;
}

export interface ContactChannel {
  id: string;
  label: string;
  value: string;
  href: string;
  placeholderNote: string;
  actionLabel: string;
}

export const PORTFOLIO_DATA = {
  profile: {
    firstName: 'KHANT',
    lastName: 'NYI NYI THIT',
    fullName: 'Khant Nyi Nyi Thit',
    role: 'SOFTWARE ENGINEER | FULL-STACK DEVELOPER',

    heroStatement:
      'I build practical web and mobile applications that solve real business problems.',

    aboutHeadline: 'I build software that solves real problems.',

    aboutLead:
      'Software developer focused on web applications, mobile tools, APIs, and business process automation.',

    aboutParagraphs: [
      'My experience combines Python, Django, REST APIs, SQL, and operational systems support.',

      'I have worked on internal tools for outlet operations and am developing a mobile warehouse stock-counting system with barcode lookup, structured counting batches, and Excel export.',

      'I enjoy turning manual processes into structured, reliable software with clear interfaces, accurate data, and maintainable code.'
    ],

    locationLabel:
      'Software Engineering · Web & Mobile Applications · Workflow Automation'
  },

  scenes: [
    {
      id: 'scene-intro',
      number: '01',
      label: 'Introduction',
      cameraPos: [0, 2.2, 13.5],
      lookAt: [0, 0.8, 0],
      accentColor: '#38bdf8',
      fogDensity: 0.028
    },
    {
      id: 'scene-about',
      number: '02',
      label: 'About',
      cameraPos: [-4.8, 3.0, 7.2],
      lookAt: [-1.2, 1.2, -4.0],
      accentColor: '#e2e8f0',
      fogDensity: 0.032
    },
    {
      id: 'scene-work',
      number: '03',
      label: 'Selected Work',
      cameraPos: [4.2, 2.5, 1.5],
      lookAt: [0.5, 1.0, -10.5],
      accentColor: '#38bdf8',
      fogDensity: 0.025
    },
    {
      id: 'scene-capabilities',
      number: '04',
      label: 'Capabilities',
      cameraPos: [-3.5, 4.2, -5.5],
      lookAt: [0, 1.5, -16.5],
      accentColor: '#f59e0b',
      fogDensity: 0.026
    },
    {
      id: 'scene-approach',
      number: '05',
      label: 'Approach',
      cameraPos: [2.8, 2.8, -11.5],
      lookAt: [0, 1.2, -22.0],
      accentColor: '#38bdf8',
      fogDensity: 0.03
    },
    {
      id: 'scene-contact',
      number: '06',
      label: 'Contact',
      cameraPos: [0, 1.8, -17.5],
      lookAt: [0, 1.2, -28.0],
      accentColor: '#94a3b8',
      fogDensity: 0.035
    }
  ] as SceneWaypoint[],

  projects: [
    {
      id: 'warehouse-stock-counting',
      number: '01',
      title: 'Warehouse Stock Counting System',
      subtitle: 'Android Stock Counting App & Django REST API',

      description:
        'An Android stock-counting application backed by a Django REST API for barcode lookup, structured counting batches, expiry dates, and Excel export.',

      extendedOverview:
        'The application helps warehouse staff record physical inventory through a guided Android workflow. Staff can look up items by barcode, record quantities against counting batches, capture expiry dates, complete counting batches, and export count data to Excel through a Django REST Framework backend.',

      technologies: [
        'Kotlin',
        'Jetpack Compose',
        'Django REST Framework',
        'Python',
        'SQLite',
        'Excel'
      ],

      status: 'In development',

      statusNote:
        'In development as an internal workflow for structured physical inventory verification.',

      visualDirection:
        'A sophisticated warehouse environment with abstract shelving, scanning beams, spatial item markers, and clean data-inspired animation.',

      dioramaType: 'warehouse',
      accentHex: '#38bdf8',

      architectureFlow: [
        {
          stage: '01 · Capture',
          title: 'Kotlin & Jetpack Compose Android Client',
          detail:
            'Barcode lookup, batch lot selection, and structured count entry at the warehouse bin level.'
        },
        {
          stage: '02 · Synchronize',
          title: 'Django REST Framework API',
          detail:
            'Validates item master records, batch identifiers, and count session timestamps.'
        },
        {
          stage: '03 · Persist',
          title: 'Structured SQLite Count Ledger',
          detail:
            'Stores session snapshots, bin locations, and variance audit trails.'
        },
        {
          stage: '04 · Export',
          title: 'Automated Excel Reporting',
          detail:
            'Generates formatted Excel workbooks ready for operational reconciliation.'
        }
      ],

      keyCapabilities: [
        'Structured physical stock count sessions with batch tracking',
        'Fast barcode lookup and item verification on Android via Jetpack Compose',
        'RESTful synchronization between mobile client and Django backend',
        'Standardized Excel workbook generation for warehouse review'
      ],

      caseStudyAnchor: '#project-01'
    },

    {
      id: 'gps-outlet-operations',
      number: '02',
      title: 'GPS Reset & Outlet Management System',
      subtitle: 'Internal GPS Reset & Outlet Removal Workflow Tool',

      description:
        'A Django-based internal operations tool for GPS coordinate reset and outlet removal workflows.',

      extendedOverview:
        'This internal tool supports requests to reset outlet GPS coordinates and process outlet removals through a Django interface. It combines SQL-backed operations and Python openpyxl spreadsheet processing to make recurring workflows more structured. Public portfolio materials omit confidential company data.',

      technologies: [
        'Python',
        'Django',
        'SQL',
        'openpyxl',
        'HTML',
        'CSS'
      ],

      status: 'Internal operational tool',

      statusNote:
        'Internal operational utility; presented with abstract architecture to protect confidential company data.',

      visualDirection:
        'Abstract geographic coordinates, a digital map-inspired environment, precise tracking lines, and controlled geometric transitions.',

      dioramaType: 'gps',
      accentHex: '#f59e0b',

      architectureFlow: [
        {
          stage: '01 · Intake',
          title: 'Outlet Identifier & Batch Upload',
          detail:
            'Accepts outlet IDs or standardized openpyxl batch templates for coordinate reset or removal.'
        },
        {
          stage: '02 · Validate',
          title: 'Django & SQL Verification Layer',
          detail:
            'Checks outlet status constraints and coordinate states before preparing operational updates.'
        },
        {
          stage: '03 · Process',
          title: 'Controlled GPS Reset / Removal Workflow',
          detail:
            'Executes structured state transitions rather than error-prone manual spreadsheet edits.'
        },
        {
          stage: '04 · Output',
          title: 'Clean Operational Audit File',
          detail:
            'Produces verified openpyxl output sheets for downstream system alignment.'
        }
      ],

      keyCapabilities: [
        'Streamlined GPS coordinate reset workflow for field outlet records',
        'Structured outlet removal validation and batch file handling',
        'Automated Excel parsing and generation via Python and openpyxl',
        'Clean web interface built with Django, HTML, and CSS'
      ],

      caseStudyAnchor: '#project-02'
    },

    {
      id: 'sap-data-dashboard',
      number: '03',
      title: 'SAP Data Dashboard',
      subtitle: 'Enterprise Data Exploration & Visual Analytics Concept',

      description:
        'A business-data visualization and dashboard concept focused on making enterprise information easier to explore.',

      extendedOverview:
        'Raw enterprise tables and exported reports can be difficult for operational stakeholders to interpret quickly. This development project connects Python and Django with SQL Server queries and interactive Chart.js views to transform structured business records into filterable visual summaries and trend breakdowns.',

      technologies: [
        'Python',
        'Django',
        'SQL Server',
        'JavaScript',
        'Chart.js'
      ],

      status: 'Development project',

      statusNote:
        'Active development concept focused on enterprise query visualization and structured filtering.',

      visualDirection:
        'Elegant analytical surfaces, dynamic charts, data streams, and structured grids.',

      dioramaType: 'sap',
      accentHex: '#38bdf8',

      architectureFlow: [
        {
          stage: '01 · Query',
          title: 'SQL Server Data Extraction',
          detail:
            'Structured relational queries aggregating operational records by period and category.'
        },
        {
          stage: '02 · Transform',
          title: 'Python & Django Data Serialization',
          detail:
            'Normalizes query results into clean JSON payloads for client-side rendering.'
        },
        {
          stage: '03 · Visualize',
          title: 'Chart.js Analytical Canvas',
          detail:
            'Renders comparative breakdowns, movement trends, and category distributions.'
        },
        {
          stage: '04 · Explore',
          title: 'Interactive Filtering Controls',
          detail:
            'Allows drilling into specific operational segments without manual pivot tables.'
        }
      ],

      keyCapabilities: [
        'Relational data aggregation backed by SQL Server and Django',
        'Interactive visual charting powered by JavaScript and Chart.js',
        'Clear tabular and graphical presentation of enterprise metrics',
        'Modular dashboard layout designed for iterative feature expansion'
      ],

      caseStudyAnchor: '#project-03'
    },

    {
      id: 'inventory-management-system',
      number: '04',
      title: 'Inventory Management System',
      subtitle: 'Product Catalog, Stock Movement Ledger & Visibility Web App',

      description:
        'A small-business inventory management project involving products, stock movements, and inventory visibility.',

      extendedOverview:
        'Built to give clear visibility into product catalogs, inbound receipts, outbound dispatches, and current stock balances. By modeling stock changes as explicit movement records in a relational database through Django, the application maintains accurate on-hand quantities and clear movement history.',

      technologies: [
        'Python',
        'Django',
        'JavaScript',
        'Relational Database'
      ],

      status: 'Web application project',

      statusNote:
        'Focused on core product catalog management, stock movement tracking, and balance visibility.',

      visualDirection:
        'A refined digital inventory environment with organized objects and animated stock movement.',

      dioramaType: 'inventory',
      accentHex: '#e2e8f0',

      architectureFlow: [
        {
          stage: '01 · Catalog',
          title: 'Product & SKU Master Schema',
          detail:
            'Defines structured product attributes, categories, and reorder thresholds.'
        },
        {
          stage: '02 · Ledger',
          title: 'Inbound & Outbound Stock Movements',
          detail:
            'Tracks every quantity adjustment with timestamped movement records.'
        },
        {
          stage: '03 · Balance',
          title: 'Relational Integrity & Stock Calculation',
          detail:
            'Maintains consistent on-hand visibility across product lines.'
        },
        {
          stage: '04 · Interface',
          title: 'Django & JavaScript Web Views',
          detail:
            'Provides responsive search, stock status tables, and quick transaction entry.'
        }
      ],

      keyCapabilities: [
        'Structured product and category management in Django',
        'Explicit inbound and outbound stock movement logging',
        'Real-time inventory balance visibility backed by relational database design',
        'Interactive JavaScript enhancements for fast table filtering'
      ],

      caseStudyAnchor: '#project-04'
    },

    {
      id: 'task-management-system',
      number: '05',
      title: 'Task Management System',
      subtitle: 'Structured Workflow Organization & Task Tracking Application',

      description:
        'A web application concept for organizing tasks and tracking work.',

      extendedOverview:
        'A clean, distraction-free web application concept designed for organizing operational tasks, assigning priorities, and tracking completion states. Built with Django, SQLite, and JavaScript, it emphasizes clear status transitions and dependable persistence.',

      technologies: [
        'Django',
        'SQLite',
        'JavaScript'
      ],

      status: 'Web application concept',

      statusNote:
        'Concept implementation exploring clean task state transitions and lightweight persistence.',

      visualDirection:
        'Minimal architectural panels, shifting task layers, and orderly transitions.',

      dioramaType: 'tasks',
      accentHex: '#38bdf8',

      architectureFlow: [
        {
          stage: '01 · Capture',
          title: 'Task Definition & Categorization',
          detail:
            'Creates structured work items with priority levels and target dates.'
        },
        {
          stage: '02 · State',
          title: 'Stage Transition Logic',
          detail:
            'Moves tasks cleanly across backlog, active, and completed states.'
        },
        {
          stage: '03 · Storage',
          title: 'SQLite Relational Persistence',
          detail:
            'Lightweight, zero-configuration relational storage via Django ORM.'
        },
        {
          stage: '04 · Interaction',
          title: 'JavaScript UI Updates',
          detail:
            'Responsive status toggling and filtered task views.'
        }
      ],

      keyCapabilities: [
        'Orderly task creation, prioritization, and status tracking',
        'Clean Django ORM data modeling with SQLite persistence',
        'Fast client-side status updates and filtering using JavaScript',
        'Minimalist editorial interface focused on readability'
      ],

      caseStudyAnchor: '#project-05'
    }
  ] as PortfolioProject[],

  capabilities: [
    {
      id: 'sap-phm-support',
      title: 'SAP / PHM Operational Support',
      category: 'Enterprise & Operations',

      summary:
        'Supporting day-to-day enterprise system operations, master data alignment, and operational issue resolution across business workflows.',

      operationalApplication:
        'Bridges field and warehouse operations with enterprise system rules, ensuring master data accuracy and smooth transaction flows.',

      connectedCapabilities: [
        'sql-databases',
        'workflow-automation',
        'python-openpyxl'
      ],

      relatedProjectIds: [
        'sap-data-dashboard',
        'gps-outlet-operations'
      ],

      coordinates: { x: -3.2, y: 1.8, z: 0 }
    },

    {
      id: 'python-django',
      title: 'Python and Django',
      category: 'Backend & Data Architecture',

      summary:
        'Building structured backend web applications, internal operational portals, ORM data models, and business logic layers.',

      operationalApplication:
        'Powers internal operations tools, inventory ledgers, and data dashboards with clean server-side architecture.',

      connectedCapabilities: [
        'rest-apis',
        'sql-databases',
        'python-openpyxl',
        'html-css'
      ],

      relatedProjectIds: [
        'warehouse-stock-counting',
        'gps-outlet-operations',
        'sap-data-dashboard',
        'inventory-management-system',
        'task-management-system'
      ],

      coordinates: { x: -1.1, y: 2.4, z: 0.8 }
    },

    {
      id: 'react-typescript',
      title: 'React and TypeScript',
      category: 'Frontend & Interface',

      summary:
        'Developing strongly-typed, component-driven modern web interfaces with interactive state management and responsive layouts.',

      operationalApplication:
        'Delivers rich interactive web experiences and clear data interfaces backed by predictable TypeScript contracts.',

      connectedCapabilities: [
        'rest-apis',
        'html-css'
      ],

      relatedProjectIds: [
        'sap-data-dashboard'
      ],

      coordinates: { x: 2.8, y: 2.1, z: 0.4 }
    },

    {
      id: 'sql-databases',
      title: 'SQL Server and SQLite',
      category: 'Backend & Data Architecture',

      summary:
        'Designing relational schemas, writing analytical and operational SQL queries, and ensuring data integrity across enterprise and local databases.',

      operationalApplication:
        'Provides reliable persistence for stock counts, inventory movements, outlet records, and enterprise dashboard reporting.',

      connectedCapabilities: [
        'sap-phm-support',
        'python-django',
        'rest-apis'
      ],

      relatedProjectIds: [
        'warehouse-stock-counting',
        'gps-outlet-operations',
        'sap-data-dashboard',
        'inventory-management-system',
        'task-management-system'
      ],

      coordinates: { x: -2.2, y: 0.3, z: -0.6 }
    },

    {
      id: 'rest-apis',
      title: 'REST APIs',
      category: 'Backend & Data Architecture',

      summary:
        'Designing structured JSON endpoints with Django REST Framework to connect mobile clients and web frontends with relational backends.',

      operationalApplication:
        'Enables Android warehouse scanners and web interfaces to synchronize structured records reliably.',

      connectedCapabilities: [
        'python-django',
        'react-typescript',
        'sql-databases'
      ],

      relatedProjectIds: [
        'warehouse-stock-counting',
        'sap-data-dashboard'
      ],

      coordinates: { x: 0.8, y: 1.4, z: 1.1 }
    },

    {
      id: 'workflow-automation',
      title: 'Workflow Automation',
      category: 'Automation & Tooling',

      summary:
        'Replacing repetitive manual data handling and multi-step spreadsheet routines with repeatable, validated software workflows.',

      operationalApplication:
        'Reduces human error in GPS outlet updates, stock reconciliation exports, and recurring operational data tasks.',

      connectedCapabilities: [
        'sap-phm-support',
        'python-openpyxl',
        'python-django'
      ],

      relatedProjectIds: [
        'warehouse-stock-counting',
        'gps-outlet-operations'
      ],

      coordinates: { x: -0.4, y: -0.6, z: 0.3 }
    },

    {
      id: 'python-openpyxl',
      title: 'Python and openpyxl',
      category: 'Automation & Tooling',

      summary:
        'Programmatic parsing, validation, and generation of structured Excel workbooks for enterprise teams and operational handoffs.',

      operationalApplication:
        'Automates spreadsheet ingestion and produces clean reconciliation workbooks without manual copy-paste errors.',

      connectedCapabilities: [
        'workflow-automation',
        'python-django',
        'sap-phm-support'
      ],

      relatedProjectIds: [
        'warehouse-stock-counting',
        'gps-outlet-operations'
      ],

      coordinates: { x: 1.6, y: -0.3, z: -0.5 }
    },

    {
      id: 'html-css',
      title: 'HTML and CSS',
      category: 'Frontend & Interface',

      summary:
        'Crafting semantic document structure, accessible forms, responsive grid layouts, and high-contrast visual hierarchy.',

      operationalApplication:
        'Ensures every operational utility and web application remains legible, accessible, and responsive across devices.',

      connectedCapabilities: [
        'react-typescript',
        'python-django'
      ],

      relatedProjectIds: [
        'gps-outlet-operations',
        'sap-data-dashboard',
        'inventory-management-system',
        'task-management-system'
      ],

      coordinates: { x: 3.3, y: 0.4, z: -0.2 }
    }
  ] as TechnicalCapability[],

  experiencePillars: [
    {
      index: '01',
      title: 'Operational Alignment',

      principle:
        'Software must reflect how real operations work on the ground.',

      description:
        'Working with SAP / PHM operational support provides direct insight into where users struggle with system workflows, master data rules, and exception handling. Every tool begins with understanding the operational constraint first.',

      operationalShift: {
        from:
          'Disconnected tools that ignore business process rules',

        to:
          'Focused utilities aligned with daily operational workflows'
      }
    },

    {
      index: '02',
      title: 'Structured Data Integrity',

      principle:
        'Clean relational schemas prevent downstream reporting failures.',

      description:
        'Whether storing count sessions in SQLite or querying enterprise tables in SQL Server, data must be validated at the boundary. Explicit models and constraints keep records trustworthy.',

      operationalShift: {
        from:
          'Unvalidated free-text columns and inconsistent spreadsheet tabs',

        to:
          'Relational tables with enforced types, keys, and audit states'
      }
    },

    {
      index: '03',
      title: 'Reducing Manual Spreadsheet Work',

      principle:
        'Automate repetitive file manipulation so teams can focus on decisions.',

      description:
        'Spreadsheets are ubiquitous in enterprise operations, but manual copy-pasting across thousands of rows invites errors. Combining Python, Django, and openpyxl turns fragile manual routines into reliable one-step workflows.',

      operationalShift: {
        from:
          'Hours of repetitive manual Excel filtering and vlookup edits',

        to:
          'Automated Python & openpyxl validation and export pipelines'
      }
    },

    {
      index: '04',
      title: 'Connecting Business & Engineering',

      principle:
        'Practical software bridges business requirements and modern web execution.',

      description:
        'From Android warehouse clients communicating over REST APIs to interactive web dashboards, the goal is always practical utility—building maintainable applications that make complex data clear and actionable.',

      operationalShift: {
        from:
          'Opaque technical bottlenecks between field teams and core data',

        to:
          'Accessible web and mobile interfaces connected via clean APIs'
      }
    }
  ] as ExperiencePillar[],

  contact: {
    headline: "LET'S BUILD SOMETHING USEFUL.",

    subheadline:
      'Open to software engineering opportunities involving Python, Django, APIs, databases, web applications, and workflow automation.',

    channels: [
      {
        id: 'email',
        label: 'Email',
        value: 'knnt1792000@gmail.com',
        href: 'mailto:knnt1792000@gmail.com',
        actionLabel: 'Send Email'
      },

      {
        id: 'github',
        label: 'GitHub',
        value: 'github.com/XiaoYanKyit',
        href: 'https://github.com/XiaoYanKyit',
        actionLabel: 'Open GitHub'
      },

      {
        id: 'linkedin',
        label: 'LinkedIn',
        value:
          'https://www.linkedin.com/in/khant-nyi-nyi-thit-91a34143b/',
        href:
          'https://www.linkedin.com/in/khant-nyi-nyi-thit-91a34143b/',
        actionLabel: 'Open LinkedIn'
      }
    ] as ContactChannel[]
  }
};