import React, { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "react-toastify";
import "./JoinCreateRoom.css";

const JoinCreateRoom = ({ uuid, setUser, setRoomJoined }) => {
  const [roomId, setRoomId] = useState(uuid());
  const [name, setName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");

  const saveRoomIdToLocalStorage = (id) => {
    const roomIds = JSON.parse(localStorage.getItem("roomIds")) || [];
    if (!roomIds.includes(id)) {
      roomIds.push(id);
      localStorage.setItem("roomIds", JSON.stringify(roomIds));
    }
  };

  const isRoomIdExist = (id) => {
    const roomIds = JSON.parse(localStorage.getItem("roomIds")) || [];
    return roomIds.includes(id);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!name) return toast.dark("Please enter your name!");

    saveRoomIdToLocalStorage(roomId);
    setUser({
      roomId,
      userId: uuid(),
      userName: name,
      host: true,
      presenter: true,
    });
    setRoomJoined(true);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!joinName) return toast.dark("Please enter your name!");

    if (!isRoomIdExist(joinRoomId)) {
      return toast.error("Room does not exist!");
    }

    setUser({
      roomId: joinRoomId,
      userId: uuid(),
      userName: joinName,
      host: true,
      presenter: true,
    });
    setRoomJoined(true);
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-12">
          <h1 className="text-center my-5 title">
            LiveBoard: A Real-time Collaborative WhiteBoard
          </h1>
        </div>
      </div>
      <div className="row mt-5">
        <div className="col-md-5 p-4 form-container mx-auto">
          <h2 className="text-center mb-4">Create Room</h2>
          <form onSubmit={handleCreateSubmit}>
            <div className="form-group my-3">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                placeholder="Enter your name"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group my-3">
              <label htmlFor="roomId">Your Room ID</label>
              <div className="input-group">
                <input
                  type="text"
                  id="roomId"
                  className="form-control"
                  value={roomId}
                  readOnly={true}
                />
                <div className="input-group-append">
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm"
                    onClick={() => setRoomId(uuid())}
                  >
                    Generate
                  </button>
                  <br />
                  <CopyToClipboard
                    text={roomId}
                    onCopy={() => toast.success("Room ID Copied!")}
                  >
                    <button type="button" className="btn btn-dark btn-sm">
                      Copy
                    </button>
                  </CopyToClipboard>
                </div>
              </div>
            </div>
            <div className="form-group mt-4">
              <button type="submit" className="btn btn-dark w-100 btn-sm">
                Create Room
              </button>
            </div>
          </form>
        </div>
        <div className="col-md-5 p-4 form-container mx-auto">
          <h2 className="text-center mb-4">Join Room</h2>
          <form onSubmit={handleJoinSubmit}>
            <div className="form-group my-3">
              <label htmlFor="joinName">Name</label>
              <input
                type="text"
                id="joinName"
                placeholder="Enter your name"
                className="form-control"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
              />
            </div>
            <div className="form-group my-3">
              <label htmlFor="joinRoomId">Room ID</label>
              <input
                type="text"
                id="joinRoomId"
                placeholder="Enter room ID"
                className="form-control"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
              />
            </div>
            <div className="form-group mt-4">
              <button type="submit" className="btn btn-dark w-100 btn-sm">
                Join Room
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinCreateRoom;
