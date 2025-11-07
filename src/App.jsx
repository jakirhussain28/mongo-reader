import React, { useState, useEffect } from 'react';
import { Database, FileJson, ChevronRight, ChevronDown, ChevronsLeft, ChevronsRight } from 'lucide-react';
import './index.css';

// --- Configuration ---
const API_URL = "http://localhost:8008";
const DOCS_PER_PAGE = 50; // Must match the 'limit' in server.py

// --- Sub-Components ---

/**
 * Renders the top header bar showing the document count
 */
const Header = ({ docCount }) => {
  return (
    <header className="bg-gray-800 text-gray-300 p-3 shadow-md z-10">
      <h1 className="text-lg font-semibold">
        Total Documents in Collection: <span className="text-white font-bold">{docCount}</span>
      </h1>
    </header>
  );
};

/**
 * Renders the right-hand sidebar for databases and collections
 */
const DatabaseSidebar = ({ databases, selectedCollection, onSelectCollection }) => {
  const [expandedDBs, setExpandedDBs] = useState({});

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
            <button
              onClick={() => toggleDB(db.name)}
              className="flex items-center w-full text-left text-gray-200 hover:text-white transition-colors rounded-md p-2 hover:bg-gray-700"
            >
              {expandedDBs[db.name] ? <ChevronDown size={16} className="mr-2 flex-shrink-0" /> : <ChevronRight size={16} className="mr-2 flex-shrink-0" />}
              <Database size={16} className="mr-2 flex-shrink-0" />
              <span className="font-semibold truncate">{db.name}</span>
            </button>
            
            {expandedDBs[db.name] && (
              <ul className="pl-6 mt-2 space-y-1">
                {db.collections.map(col => {
                  const isSelected = selectedCollection === col.name;
                  return (
                    <li key={col.name}>
                      <button
                        onClick={() => onSelectCollection(db.name, col.name)} // This now resets to page 1
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

  // --- Recursive JSON Renderer Components ---

  const JsonValue = ({ value }) => {
    const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

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
      if (OBJECT_ID_REGEX.test(value)) {
        return (
          <span>
            <span className="text-purple-400">ObjectId</span>
            (<span className="text-red-400">'{value}'</span>)
          </span>
        );
      }
      if (ISO_DATE_REGEX.test(value)) {
        return <span className="text-cyan-400">"{value}"</span>;
      }
      return <span className="text-green-400">"{value}"</span>;
    }
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
    return <span>{String(value)}</span>;
  };
  
  const RecursiveObjectRenderer = ({ obj }) => {
    const keys = Object.keys(obj);
    if (keys.length === 0) return <span>{"{ }"}</span>;

    return (
      <span>
        {"{"}
        {keys.map((key, index) => (
          <div key={key} className="pl-4">
            <span className="text-gray-300">{key}</span>
            <span className="text-white">: </span>
            <JsonValue value={obj[key]} />
            {index < keys.length - 1 ? <span className="text-white">,</span> : ''}
          </div>
        ))}
        {"}"}
      </span>
    );
  };

  const MongoJsonRenderer = ({ json }) => (
    <pre><RecursiveObjectRenderer obj={json} /></pre>
  );
  
  // --- Main DocumentView return ---
  return (
    <main className="flex-1 bg-gray-900 p-6 overflow-y-auto">
      <div className="space-y-4">
        {documents.length > 0 ? (
          documents.map((doc) => (
            <div key={doc._id} className="bg-gray-800 rounded-lg p-4 font-mono text-sm text-gray-300 border border-gray-700 shadow-sm">
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
 * Renders pagination controls
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null; // Don't show pagination if there's only one page
  }

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="bg-gray-800 p-3 flex justify-center items-center space-x-4 border-t border-gray-700">
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="pagination-btn"
      >
        <ChevronsLeft size={16} />
      </button>
      <span className="text-gray-400 text-sm">
        Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
      </span>
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="pagination-btn"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- NEW STATE FOR CACHING & PAGINATION ---
  const [dataCache, setDataCache] = useState({}); // In-memory cache
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --- DATA FETCHING ---

  // Fetch database list on initial load
  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/databases`)
      .then(res => res.ok ? res.json() : Promise.reject(new Error(res.statusText)))
      .then(data => {
        setDatabases(data);
        
        // --- NEW: Check localStorage for a saved selection ---
        const cachedDb = localStorage.getItem('selectedDb');
        const cachedCollection = localStorage.getItem('selectedCollection');
        
        if (cachedDb && cachedCollection) {
          // Load the saved collection (will default to page 1)
          fetchDocuments(cachedDb, cachedCollection, 1, false);
        } else if (data.length > 0 && data[0].collections.length > 0) {
          // Otherwise, load the first collection (default to page 1)
          fetchDocuments(data[0].name, data[0].collections[0].name, 1, false);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []); // Runs once on mount

  /**
   * Fetches documents for a specific collection and page.
   * Handles caching and state updates.
   */
  const fetchDocuments = (dbName, collectionName, page = 1, setLoadingState = true) => {
    if (setLoadingState) setLoading(true);
    setError(null);
    
    // --- NEW: Caching logic ---
    const cacheKey = `${dbName}/${collectionName}?page=${page}`;
    if (dataCache[cacheKey]) {
      // 1. Load from cache
      const cachedData = dataCache[cacheKey];
      setDocuments(cachedData.documents);
      setDocCount(cachedData.count);
      setCurrentPage(page);
      setTotalPages(Math.ceil(cachedData.count / DOCS_PER_PAGE));
      setSelectedDb(dbName);
      setSelectedCollection(collectionName);
      setLoading(false);
      return; // Stop here
    }

    // 2. If not in cache, fetch from API
    fetch(`${API_URL}/api/databases/${dbName}/collections/${collectionName}?page=${page}&limit=${DOCS_PER_PAGE}`)
      .then(res => res.ok ? res.json() : Promise.reject(new Error(res.statusText)))
      .then(data => {
        setDocuments(data.documents);
        setDocCount(data.count);
        setCurrentPage(page);
        setTotalPages(Math.ceil(data.count / DOCS_PER_PAGE));
        setSelectedDb(dbName);
        setSelectedCollection(collectionName);

        // --- NEW: Save to localStorage and cache ---
        localStorage.setItem('selectedDb', dbName);
        localStorage.setItem('selectedCollection', collectionName);
        setDataCache(prevCache => ({
          ...prevCache,
          [cacheKey]: data // Save the fetched data to cache
        }));
      })
      .catch(err => {
        setError(err.message);
        setDocuments([]);
        setDocCount(0);
      })
      .finally(() => setLoading(false));
  };

  /**
   * Called when clicking a *new* collection from the sidebar.
   * Always resets to page 1.
   */
  const handleSelectCollection = (dbName, collectionName) => {
    fetchDocuments(dbName, collectionName, 1); // Always fetch page 1 for a new selection
  };
  
  /**
   * Called by the Pagination component.
   */
  const handlePageChange = (newPage) => {
    if (selectedDb && selectedCollection) {
      fetchDocuments(selectedDb, selectedCollection, newPage);
    }
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col h-screen font-sans text-white bg-gray-900">
      <Header docCount={docCount} />
      <div className="flex flex-1 overflow-hidden">
        
        <DatabaseSidebar
          databases={databases}
          selectedCollection={selectedCollection}
          onSelectCollection={handleSelectCollection}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading && <div className="p-4 text-center text-gray-500">Loading...</div>}
          {error && <div className="p-4 text-center text-red-500">Error: {error}</div>}
          
          {!loading && !error && (
            <>
              <DocumentView documents={documents} />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}