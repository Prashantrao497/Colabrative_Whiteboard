import React, { useEffect, useLayoutEffect, useState } from "react";
import rough from "roughjs/bundled/rough.esm";

const generator = rough.generator();

const Canvas = ({
  canvasRef,
  ctx,
  color,
  setElements,
  elements,
  tool,
  socket,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.height = window.innerHeight * 2;
    canvas.width = window.innerWidth * 2;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const context = canvas.getContext("2d");
    context.scale(2, 2);
    context.lineCap = "round";
    context.strokeStyle = color;
    context.lineWidth = 5;
    ctx.current = context;

    // Sync full state when joining a room or when updates happen
    socket.on("canvasImage", (updatedElements) => {
      setElements(updatedElements);
    });

    // Handle clear canvas event
    socket.on("clear-canvas", () => {
      setElements([]);
    });

    return () => {
      socket.off("canvasImage");
      socket.off("clear-canvas");
    };
  }, [socket]);

  useEffect(() => {
    if (ctx.current) {
      ctx.current.strokeStyle = color;
    }
  }, [color]);

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;

    const newElement = {
      id: Date.now(),
      offsetX,
      offsetY,
      endX: offsetX,
      endY: offsetY,
      stroke: color,
      element: tool,
      path: tool === "pencil" ? [[offsetX, offsetY]] : [],
    };

    setCurrentElement(newElement);
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentElement) return;

    const { offsetX, offsetY } = e.nativeEvent;

    const updatedElement = { ...currentElement };

    if (tool === "pencil") {
      updatedElement.path = [...updatedElement.path, [offsetX, offsetY]];
    } else if (tool === "line") {
      updatedElement.endX = offsetX;
      updatedElement.endY = offsetY;
    } else if (tool === "rect" || tool === "circle" || tool === "triangle") {
      updatedElement.endX = offsetX;
      updatedElement.endY = offsetY;
    }

    setCurrentElement(updatedElement);
    setElements((prevElements) => [
      ...prevElements.slice(0, -1),
      updatedElement,
    ]);
  };

  const handleMouseUp = () => {
    if (!currentElement) return;

    const finalizedElement = currentElement;
    socket.emit("drawing-update", finalizedElement); // Emit to server

    setCurrentElement(null);
    setIsDrawing(false);
  };

  useLayoutEffect(() => {
    const roughCanvas = rough.canvas(canvasRef.current);

    if (ctx.current) {
      ctx.current.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      elements.forEach((ele) => {
        if (ele.element === "rect") {
          roughCanvas.draw(
            generator.rectangle(
              ele.offsetX,
              ele.offsetY,
              ele.endX - ele.offsetX,
              ele.endY - ele.offsetY,
              {
                stroke: ele.stroke,
                roughness: 0,
                strokeWidth: 5,
              }
            )
          );
        } else if (ele.element === "line") {
          roughCanvas.draw(
            generator.line(ele.offsetX, ele.offsetY, ele.endX, ele.endY, {
              stroke: ele.stroke,
              roughness: 0,
              strokeWidth: 5,
            })
          );
        } else if (ele.element === "pencil") {
          roughCanvas.linearPath(ele.path, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: 5,
          });
        } else if (ele.element === "circle") {
          const radius = Math.sqrt(
            Math.pow(ele.endX - ele.offsetX, 2) +
              Math.pow(ele.endY - ele.offsetY, 2)
          );
          roughCanvas.draw(
            generator.circle(ele.offsetX, ele.offsetY, radius * 2, {
              stroke: ele.stroke,
              roughness: 0,
              strokeWidth: 5,
            })
          );
        } else if (ele.element === "triangle") {
          const size = Math.sqrt(
            Math.pow(ele.endX - ele.offsetX, 2) +
              Math.pow(ele.endY - ele.offsetY, 2)
          );
          const points = [
            [ele.offsetX, ele.endY],
            [ele.endX, ele.endY],
            [ele.offsetX + (ele.endX - ele.offsetX) / 2, ele.offsetY],
          ];
          roughCanvas.draw(
            generator.polygon(points, {
              stroke: ele.stroke,
              roughness: 0,
              strokeWidth: 5,
            })
          );
        }
      });
    }
  }, [elements]);

  return (
    <div className="canvas-container">
      <div
        className="col-md-8 overflow-hidden border border-dark px-0 mx-auto mt-3"
        style={{ height: "500px" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default Canvas;
