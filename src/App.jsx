import React, { useState, useEffect } from 'react';
import { Database, FileJson, ChevronRight, ChevronDown } from 'lucide-react';
import './index.css';

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
  const [expandedDBs, setExpandedDBs] = useState({});

  // NEW: Automatically expand the first database when data loads
  useEffect(() => {
    if (databases.length > 0 && !expandedDBs[databases[0].name]) {
      setExpandedDBs({ [databases[0].name]: true });
    }
  }, [databases]);


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
              {expandedDBs[db.name] ? <ChevronDown size={16} className="mr-2 flex flex-shrink-0" /> : <ChevronRight size={16} className="mr-2 flex flex-shrink-0" />}
              <Database size={16} className="mr-2 flex flex-shrink-0" />
              <span className="font-semibold truncate">{db.name}</span>
            </button>
            
            {/* Collections List */}
            {expandedDBs[db.name] && (
              <ul className="pl-6 mt-2 space-y-1">
                {db.collections.map(col => {
                  // The data from /api/databases is now { name: "..." }
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

  // --- NEW RECURSIVE JSON RENDERER ---

  /**
   * Renders a single JSON value, applying special styles based on
   * data type.
   */
  const JsonValue = ({ value }) => {
    // Regex to detect ISO date strings
    const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    // Regex to detect 24-character hex strings (ObjectId)
    const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

    
    // --- Standard Types ---
    if (value === null) {
      return <span className="text-gray-500">null</span>;
    }
    if (typeof value === 'boolean') {
      return <span className="text-purple-400">{String(value)}</span>;
    }
    if (typeof value === 'number') {
      return <span className="text-orange-400">{value}</span>;
    }
    
    if (typeof value === 'string') {
      
      // --- THIS IS THE FIX ---
      // 1. Check if it LOOKS like an ObjectId
      if (OBJECT_ID_REGEX.test(value)) {
        return (
          <span>
            <span className="text-purple-400">ObjectId</span>
            (<span className="text-red-400">'{value}'</span>)
          </span>
        );
      }

      // 2. Check if it's a Date string
      if (ISO_DATE_REGEX.test(value)) {
        return <span className="text-cyan-400">"{value}"</span>;
      }
      
      // 3. Otherwise, it's a normal string
      return <span className="text-green-400">"{value}"</span>;
    }

    // --- Recursive Types ---
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-500">Array (empty)</span>;
      }
      return (
        <span>
          [
          {value.map((item, index) => (
            <div key={index} className="pl-4">
              <JsonValue value={item} />
              {index < value.length - 1 ? <span className="text-white">,</span> : ''}
            </div>
          ))}
          ]
        </span>
      );
    }
    
    if (typeof value === 'object' && value !== null) {
      return <RecursiveObjectRenderer obj={value} />;
    }

    // Fallback
    return <span>{String(value)}</span>;
  };
  
  /**
   * Recursively renders the key-value pairs of an object.
   */
  const RecursiveObjectRenderer = ({ obj }) => {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return <span>{"{ }"}</span>;
    }

    return (
      <span>
        {"{"}
        {keys.map((key, index) => (
          <div key={key} className="pl-4">
            {/* --- Keys in plain text (User Request) --- */}
            <span className="text-gray-300">{key}</span>
            <span className="text-white">: </span>
            
            {/* Pass 'isIdKey' prop to JsonValue so it knows to style specially */}
            <JsonValue value={obj[key]} />
            
            {index < keys.length - 1 ? <span className="text-white">,</span> : ''}
          </div>
        ))}
        {"}"}
      </span>
    );
  };

  /**
   * The main wrapper component that replaces the old JsonSyntaxHighlight.
   * It starts the recursive rendering process.
   */
  const MongoJsonRenderer = ({ json }) => {
    return (
      <pre>
        <RecursiveObjectRenderer obj={json} />
      </pre>
    );
  };
  
  // --- Main DocumentView return ---
  return (
    <main className="flex-1 bg-gray-900 p-6 overflow-y-auto">
      <div className="space-y-4">
        {documents.length > 0 ? (
          documents.map((doc, index) => (
            <div key={doc._id || index} className="bg-gray-800 rounded-lg p-4 font-mono text-sm text-gray-300 border border-gray-700 shadow-sm">
              {/* --- USE THE NEW RENDERER --- */}
              <MongoJsonRenderer json={doc} />
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
  const [loading, setLoading] = useState(true); // Start loading true
  const [error, setError] = useState(null);

  // --- BASE URL for the API ---
  const API_URL = "http://127.0.0.1:8008";

  // On component mount, fetch the database list
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // --- REAL API CALL ---
    fetch(`${API_URL}/api/databases`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setDatabases(data);
        // Automatically select the first db/collection
        if (data.length > 0 && data[0].collections.length > 0) {
          handleSelectCollection(data[0].name, data[0].collections[0].name, false); // Pass false to avoid double loading
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
    
  }, []); // Empty dependency array means this runs once on mount

  // This function is called when a collection is clicked
  const handleSelectCollection = (dbName, collectionName, setLoadingState = true) => {
    if (setLoadingState) {
      setLoading(true);
    }
    setError(null);
    setSelectedDb(dbName);
    setSelectedCollection(collectionName);

    // --- REAL API CALL ---
    fetch(`${API_URL}/api/databases/${dbName}/collections/${collectionName}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setDocuments(data.documents);
        setDocCount(data.count);
      })
      .catch(err => {
        setError(err.message);
        setDocuments([]);
        setDocCount(0);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col h-screen font-sans text-white bg-gray-900">
      <Header docCount={docCount} />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Database Sidebar */}
        <DatabaseSidebar
          databases={databases}
          selectedCollection={selectedCollection}
          onSelectCollection={handleSelectCollection}
        />
        
        {/* Right Pane: Document View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading && <div className="p-4 text-center text-gray-500">Loading...</div>}
          {error && <div className="p-4 text-center text-red-500">Error: {error}</div>}
          {!loading && !error && <DocumentView documents={documents} />}
        </div>
        
      </div>
    </div>
  );
}