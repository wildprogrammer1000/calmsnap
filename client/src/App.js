import { useState } from "react";
import LoginView from "./view/LoginView";
import MainView from "./view/MainView";
import MatchView from "./view/MatchView";
import { nakama } from "./util/nakama";
import { useDispatch } from "react-redux";
import { refresh } from "./util/account";

import Test from './view/Test'

import "./App.css";

function App() {
  const dispatch = useDispatch();
  const [view, setView] = useState(0);
  const getAccount = async () => {
    const account = await nakama.getAccount();
    dispatch(refresh(account));
  };

  const onChannelMessage = (data) => {
    console.log("message", data);
    data.type = "chat";
    window.postMessage(data, window.origin);
  };

  const joinChat = () => {
    console.log("nakama", nakama);
    if (!nakama.socket) return;
    nakama.socket.onchannelmessage = onChannelMessage;
    nakama.socket.joinChat("all", 1, true);
  };

  return (
    <>
      {view === 0 && <LoginView setView={setView} joinChat={joinChat} />}
      {view === 1 && <MainView setView={setView} refreshAccount={getAccount} />}
      {view === 2 && (
        <MatchView refreshAccount={getAccount} setView={setView} />
      )}

      {view === 100 && <Test/>}
    </>
  );
}

export default App;
