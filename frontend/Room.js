import React, { useEffect, useRef, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "react-toastify";
import Canvas from "./Canvas";
import Chat from "./Chat";
import ChatWithAi from "./ChatWithAi";
import "./style.css";
import "./Room.css"; // Import new styles for rainbow heading and chat UI

const Room = ({ userNo, user, socket, setUsers, setUserNo }) => {
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const [color, setColor] = useState("#000000");
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [tool, setTool] = useState("pencil");
  const [isChatVisible, setChatVisible] = useState(false); // State for chat visibility
  const [isShapeDropdownVisible, setShapeDropdownVisible] = useState(false); // State for shape dropdown visibility

  useEffect(() => {
    socket.on("message", (data) => {
      toast.info(data.message);
    });

    return () => {
      socket.off("message");
    };
  }, []);

  useEffect(() => {
    socket.on("users", (data) => {
      setUsers(data);
      setUserNo(data.length);
    });

    socket.emit("presenter", {
      color,
      tool,
      elements,
      user,
      roomId: user.roomId,
    });

    return () => {
      socket.off("users");
    };
  }, [user]);

  useEffect(() => {
    socket.on("clear-canvas", () => {
      clearCanvasLocal();
    });

    socket.on("undo-canvas", (undoneElement) => {
      undoCanvasLocal(undoneElement);
    });

    socket.on("redo-canvas", (redoneElement) => {
      redoCanvasLocal(redoneElement);
    });

    return () => {
      socket.off("clear-canvas");
      socket.off("undo-canvas");
      socket.off("redo-canvas");
    };
  }, [socket, elements, history]);

  const clearCanvasLocal = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    setElements([]);
  };

  const clearCanvas = () => {
    clearCanvasLocal();
    socket.emit("clear-canvas");
  };

  const undoCanvasLocal = (undoneElement) => {
    if (undoneElement) {
      setHistory((prevHistory) => [...prevHistory, undoneElement]);
      setElements((prevElements) =>
        prevElements.filter((ele) => ele.id !== undoneElement.id)
      );
    }
  };

  const undo = () => {
    const lastElement = elements[elements.length - 1];
    if (lastElement) {
      undoCanvasLocal(lastElement);
      socket.emit("undo-canvas");
    }
  };

  const redoCanvasLocal = (redoneElement) => {
    if (redoneElement) {
      setElements((prevElements) => [...prevElements, redoneElement]);
      setHistory((prevHistory) =>
        prevHistory.filter((ele) => ele.id !== redoneElement.id)
      );
    }
  };

  const redo = () => {
    const lastHistoryElement = history[history.length - 1];
    if (lastHistoryElement) {
      redoCanvasLocal(lastHistoryElement);
      socket.emit("redo-canvas", lastHistoryElement);
    }
  };

  const handleShapeSelection = (shape) => {
    setTool(shape);
    setShapeDropdownVisible(false); // Close the dropdown after selection
  };

  // Function to download the canvas as an image
  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "canvas-drawing.png"; // Set the file name
    link.click(); // Trigger the download
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-12">
          <h1 className="display-5 pt-4 pb-3 text-center title">
            WELCOME TO LIVE-BOARD <br />{" "}
            <span className="user"> Users Online: {userNo}</span>
          </h1>
        </div>
      </div>
      <div className="row justify-content-center align-items-center text-center py-2">
        <div className="col-md-6 d-flex justify-content-around">
          {/* Undo */}
          <button
            type="button"
            className="btn btn-outline-dark"
            disabled={elements.length === 0}
            onClick={() => undo()}
          >
            <i className="fas fa-undo"></i>
          </button>

          {/* Redo */}
          <button
            type="button"
            className="btn btn-outline-dark"
            disabled={history.length < 1}
            onClick={() => redo()}
          >
            <i className="fas fa-redo"></i>
          </button>

          {/* Color Picker */}
          <div className="btn-group">
            <button
              className="btn btn-outline-dark"
              onClick={() =>
                document.getElementById("hidden-color-picker").click()
              }
            >
              <i className="fas fa-palette"></i>
            </button>
            <input
              id="hidden-color-picker"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ display: "none" }}
            />
          </div>

          {/* Pencil Tool */}
          <button
            className={`btn btn-outline-dark ${
              tool === "pencil" ? "active" : ""
            }`}
            onClick={() => setTool("pencil")}
          >
            <i className="fas fa-pencil-alt"></i>
          </button>

          {/* Line Tool */}
          <button
            className={`btn btn-outline-dark ${
              tool === "line" ? "active" : ""
            }`}
            onClick={() => setTool("line")}
          >
            <i className="fas fa-slash"></i>
          </button>

          {/* Shape Tool Dropdown */}
          <div className="btn-group" style={{ position: "relative" }}>
            <button
              className="btn btn-outline-dark"
              onClick={() => setShapeDropdownVisible(!isShapeDropdownVisible)}
            >
              <i className="fas fa-shapes"></i>
            </button>
            {isShapeDropdownVisible && (
              <div
                className="dropdown-menu"
                style={{
                  position: "absolute",
                  top: "-100px", // Positioning the dropdown above the button
                  left: "0",
                  zIndex: "9999",
                }}
              >
                <button
                  className="dropdown-item"
                  onClick={() => handleShapeSelection("rect")}
                >
                  Rectangle
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => handleShapeSelection("circle")}
                >
                  Circle
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => handleShapeSelection("triangle")}
                >
                  Triangle
                </button>
              </div>
            )}
          </div>

          {/* Clear Canvas */}
          <button
            type="button"
            className="btn btn-outline-dark"
            onClick={clearCanvas}
          >
            <i className="fas fa-trash-alt"></i>
          </button>

          {/* Chat Toggle */}
          <button
            type="button"
            className="btn btn-outline-dark"
            onClick={() => setChatVisible(!isChatVisible)}
          >
            <i className="fas fa-comments"></i>
          </button>

          {/* Copy Room ID */}
          <CopyToClipboard
            text={user.roomId}
            onCopy={() => toast.success("Room ID Copied to Clipboard!")}
          >
            <button className="btn btn-outline-dark">
              <i className="fas fa-link"></i> {/* Changed icon */}
            </button>
          </CopyToClipboard>

          {/* Download Canvas */}
          <button
            type="button"
            className="btn btn-outline-dark"
            onClick={downloadCanvas}
          >
            <i className="fas fa-download"></i>
          </button>
        </div>
      </div>
      <div className="row">
        <Canvas
          canvasRef={canvasRef}
          ctx={ctx}
          color={color}
          setElements={setElements}
          elements={elements}
          tool={tool}
          socket={socket}
        />
      </div>
      {/* Chat Component */}
      {isChatVisible && (
        <div className="Chat">
          <Chat user={user} />
          <ChatWithAi />
        </div>
      )}
    </div>
  );
};

export default Room;
