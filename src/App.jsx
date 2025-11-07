import React, { useState, useEffect } from 'react';
import { Database, FileJson, ChevronRight, ChevronDown } from 'lucide-react';
import './index.css';

// --- Mock Data ---
// Replace this with data fetched from your FastAPI backend
const MOCK_DATABASES = [
  {
    name: "productionDB",
    collections: [
      {
        name: "users",
        count: 2,
        documents: [
          {
            _id: "68ca31a1e7a0c6e58d39de6d1",
            email: "zakirhussain281999@gmail.com",
            password: "$2b$12$Z91vQ...V2MNKrCTrq",
            name: "Zakir Hussain",
            bio: "Hi, I am MaxFinder Creator.",
            college: "PVG'S College Of Engineering, Technology And Management, Pune",
            createdAt: "2025-08-17T09:27:21.727+00:00"
          },
          {
            _id: "6905ae0cfc09adf40b076dfe1",
            email: "jakirhussain28101999@gmail.com",
            password: "$2b$12$9xjV...c/pcI29Xuy",
            name: "jakirhussain28101999",
            bio: "Hi, I am a MaxFinder user.",
            createdAt: "2025-11-01T12:21:56.445+00:00",
            college: ""
          }
        ]
      },
      {
        name: "products",
        count: 3,
        documents: [
          { _id: "prod_001", name: "Laptop", price: 1200, stock: 15 },
          { _id: "prod_002", name: "Mouse", price: 45, stock: 100 },
          { _id: "prod_003", name: "Keyboard", price: 80, stock: 75 },
        ]
      },
      {
        name: "orders",
        count: 1,
        documents: [
          { _id: "order_987", userId: "6905ae0c...", total: 1245, items: ["prod_001", "prod_002"] }
        ]
      }
    ]
  },
  {
    name: "developmentDB",
    collections: [
      {
        name: "test_users",
        count: 1,
        documents: [
          { _id: "test_001", name: "Test User", status: "active" }
        ]
      },
      {
        name: "logs",
        count: 5,
        documents: [
          { _id: "log_001", level: "info", message: "Server started" },
          { _id: "log_002", level: "info", message: "DB connected" },
          { _id: "log_003", level: "warn", message: "Cache miss" },
          { _id: "log_004", level: "info", message: "User login" },
          { _id: "log_005", level: "error", message: "Failed to load resource" },
        ]
      }
    ]
  }
];

// --- Sub-Components (All in one file) ---

/**
 * Renders the top header bar showing the document count
 */
const Header = ({ docCount }) => {
  return (
    <header className="bg-gray-800 text-gray-300 p-3 shadow-md z-10">
      <h1 className="text-lg font-semibold">
        Total Documents: <span className="text-white font-bold">{docCount}</span>
      </h1>
    </header>
  );
};

/**
 * Renders the right-hand sidebar for databases and collections
 */
const DatabaseSidebar = ({ databases, selectedCollection, onSelectCollection }) => {
  const [expandedDBs, setExpandedDBs] = useState(() => {
    // Automatically expand the first database by default
    const initialState = {};
    if (databases.length > 0) {
      initialState[databases[0].name] = true;
    }
    return initialState;
  });

  const toggleDB = (dbName) => {
    setExpandedDBs(prev => ({ ...prev, [dbName]: !prev[dbName] }));
  };

  return (
    <nav className="w-64 bg-gray-800 text-gray-400 p-4 overflow-y-auto">
      <h2 className="text-xs uppercase font-bold text-gray-500 mb-4">Databases</h2>
      <div className="space-y-4">
        {databases.map(db => (
          <div key={db.name}>
            {/* Database Name Toggle */}
            <button
              onClick={() => toggleDB(db.name)}
              className="flex items-center w-full text-left text-gray-200 hover:text-white transition-colors rounded-md p-2 hover:bg-gray-700"
            >
              {expandedDBs[db.name] ? <ChevronDown size={16} className="mr-2 flex flex-shrink-0" /> : <ChevronRight size={16} className="mr-2 flex-shrink-0" />}
              <Database size={16} className="mr-2 flex flex-shrink-0" />
              <span className="font-semibold truncate">{db.name}</span>
            </button>
            
            {/* Collections List */}
            {expandedDBs[db.name] && (
              <ul className="pl-6 mt-2 space-y-1">
                {db.collections.map(col => {
                  const isSelected = selectedCollection === col.name;
                  return (
                    <li key={col.name}>
                      <button
                        onClick={() => onSelectCollection(db.name, col.name)}
                        className={`
                          flex items-center w-full text-left rounded-md px-3 py-2 transition-all
                          ${isSelected
                            ? 'bg-blue-600/20 text-blue-300 border-l-4 border-blue-500 font-medium'
                            : 'hover:bg-gray-700/50 hover:text-gray-200'
                          }
                        `}
                      >
                        <FileJson size={14} className="mr-2 flex-shrink-0" />
                        <span className="truncate">{col.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
};

/**
 * Renders the main content area showing the documents
 */
const DocumentView = ({ documents }) => {
  // Helper to nicely format JSON with syntax highlighting
  const JsonSyntaxHighlight = ({ json }) => {
    let jsonText = JSON.stringify(json, null, 2);
    
    // Simple regex for syntax highlighting
    jsonText = jsonText
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
        let cls = 'text-green-400'; // string
        if (/:$/.test(match)) {
          cls = 'text-blue-400'; // key
        }
        return `<span class="${cls}">${match}</span>`;
      })
      .replace(/\b(true|false)\b/g, '<span class="text-purple-400">$1</span>') // boolean
      .replace(/\b(null)\b/g, '<span class="text-gray-500">$1</span>') // null
      .replace(/(\d+)/g, '<span class="text-orange-400">$1</span>'); // number

    return <pre dangerouslySetInnerHTML={{ __html: jsonText }} />;
  };

  return (
    <main className="flex-1 bg-gray-900 p-6 overflow-y-auto">
      <div className="space-y-4">
        {documents.length > 0 ? (
          documents.map((doc, index) => (
            <div key={doc._id || index} className="bg-gray-800 rounded-lg p-4 font-mono text-sm text-gray-300 border border-gray-700 shadow-sm">
              <JsonSyntaxHighlight json={doc} />
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-center p-10">
            Select a collection to view its documents.
          </div>
        )}
      </div>
    </main>
  );
};


/**
 * Main App Component
 */
export default function App() {
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docCount, setDocCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- API CALL SIMULATION ---
  // On component mount, simulate fetching the database list
  useEffect(() => {
    setLoading(true);
    setError(null);
    //
    // --- REAL API CALL WOULD GO HERE ---
    // Example:
    // fetch('http://127.0.0.1:8000/api/databases')
    //   .then(res => res.json())
    //   .then(data => {
    //     setDatabases(data);
    //     // Optionally, select the first db/collection
    //     if (data.length > 0 && data[0].collections.length > 0) {
    //       handleSelectCollection(data[0].name, data[0].collections[0].name);
    //     }
    //   })
    //   .catch(err => setError(err.message))
    //   .finally(() => setLoading(false));
    //
    // --- MOCK IMPLEMENTATION ---
    setTimeout(() => {
      setDatabases(MOCK_DATABASES);
      // Auto-select first collection of first DB
      if (MOCK_DATABASES.length > 0 && MOCK_DATABASES[0].collections.length > 0) {
        handleSelectCollection(MOCK_DATABASES[0].name, MOCK_DATABASES[0].collections[0].name);
      }
      setLoading(false);
    }, 500); // Simulate network delay
    //
  }, []); // Empty dependency array means this runs once on mount

  // --- API CALL SIMULATION ---
  // This function is called when a collection is clicked
  const handleSelectCollection = (dbName, collectionName) => {
    setLoading(true);
    setError(null);
    setSelectedDb(dbName);
    setSelectedCollection(collectionName);

    //
    // --- REAL API CALL WOULD GO HERE ---
    // Example:
    // fetch(`http://127.0.0.1:8000/api/databases/${dbName}/collections/${collectionName}`)
    //   .then(res => res.json())
    //   .then(data => {
    //     setDocuments(data.documents);
    //     setDocCount(data.count);
    //   })
    //   .catch(err => setError(err.message))
    //   .finally(() => setLoading(false));
    //
    // --- MOCK IMPLEMENTATION ---
    setTimeout(() => {
      try {
        const db = MOCK_DATABASES.find(d => d.name === dbName);
        const collection = db.collections.find(c => c.name === collectionName);
        setDocuments(collection.documents);
        setDocCount(collection.count);
      } catch (err) {
        setError("Failed to load mock data.");
        setDocuments([]);
        setDocCount(0);
      }
      setLoading(false);
    }, 300); // Simulate network delay
    //
  };

  return (
    <div className="flex flex-col h-screen font-sans text-white bg-gray-900">
      <Header docCount={docCount} />
      <div className="flex flex-1 overflow-hidden">
        {/*
          This layout now matches the screenshot:
          Navigation Sidebar (left) | Document View (right)
        */}

        {/* Left Pane: Database Sidebar */}
        <DatabaseSidebar
          databases={databases}
          selectedCollection={selectedCollection}
          onSelectCollection={handleSelectCollection}
        />
        
        {/* Right Pane: Document View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading && <div className="p-4 text-center text-gray-500">Loading...</div>}
          {error && <div className="p-4 text-center text-red-500">{error}</div>}
          {!loading && !error && <DocumentView documents={documents} />}
        </div>
        
      </div>
    </div>
  );
}