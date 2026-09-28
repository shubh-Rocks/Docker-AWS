import "./App.css";
import { Editor } from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import { MonacoBinding } from "y-monaco";

function App() {
  const [userName, setUserName] = useState(() => {
    return new URLSearchParams(window.location.search).get("userName") || "";
  });

  const [users, setUsers] = useState([]);

  const editorRef = useRef(null);

  const yDoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => yDoc.getText("monaco"), [yDoc]);

  const handleMount = (editor) => {
    editorRef.current = editor;

    new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
    );
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setUserName(e.target.userName.value);
    window.history.pushState({}, "", "?userName=" + e.target.userName.value);
  };

  useEffect(() => {
    if (userName) {
      const provider = new SocketIOProvider(
        "http://localhost:3100",
        "monaco",
        yDoc,
        {
          autoConnect: true,
        },
      );

      provider.awareness.setLocalStateField("user", { userName });

      provider.awareness.on("change", () => {
        const state = Array.from(provider.awareness.getStates().values());
        setUsers(
          state
            .filter((state) => state.user && state.user.userName)
            .map((state) => state.user),
        );
      });

      function handleBeforeUnload() {
        provider.awareness.setLocalStateField("user", null);
      }

      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        provider.disconnect();
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [userName]);

  if (!userName) {
    return (
      <main className="h-screen w-full bg-gray-900 flex gap-4 items-center justify-center">
        <form
          onSubmit={handleJoin}
          className="bg-gray-800 p-6 rounded-lg flex flex-col gap-4"
        >
          <h2 className="text-xl font-bold text-white mb-4">Enter Your Name</h2>
          <input
            type="text"
            name="userName"
            placeholder="Your Name"
            className="bg-gray-600 text-white placeholder:text-gray-400 rounded-lg p-3 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="mt-4 bg-amber-50 font-bold py-2 px-4 rounded cursor-pointer hover:scale-105 transition-transform duration-200"
          >
            Join
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="bg-gray-950 h-screen w-full flex gap-4 p-4">
      <aside className="bg-amber-50 h-full w-1/4 rounded-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4 p-4">Users</h2>
        <ul className="p-4">
          {users.map((user, index) => (
            <li key={index} className="text-gray-900 mb-2">
              {user.userName}
            </li>
          ))}
        </ul>
      </aside>
      <section className="w-3/4 rounded-lg bg-neutral-700 overflow-hidden">
        <Editor
          height="100%"
          defaultValue="// Hello, World!"
          theme="vs-dark"
          defaultLanguage="javascript"
          onMount={handleMount}
        />
      </section>
    </main>
  );
}

export default App;
