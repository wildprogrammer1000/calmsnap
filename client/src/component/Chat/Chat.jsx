import { useState, useEffect, useRef } from "react";
import { nakama } from "../../util/nakama";
import { useSelector } from "react-redux";
import style from "./Chat.module.css";
import SendIcon from "@mui/icons-material/Send";
const Chat = () => {
  const account = useSelector((state) => state.default.value);
  const scrollRef = useRef();
  const [chats, setChats] = useState([]);
  const [chatValue, setChatValue] = useState("");
  const [focus, setFocus] = useState();
  const onMessage = (msg) => {
    const data = msg.data;
    if (data.type !== "chat") return;
    const content = data.content;
    console.log("content", content);
    setChats((state) => [...state, content]);
  };
  const sendChat = (ev) => {
    if (!nakama.socket || !chatValue.length) return;
    ev.preventDefault();
    const payload = {
      username: account.user.username,
      user_id: account.user.id,
      chat: chatValue,
    };
    setChatValue("");
    nakama.socket.writeChatMessage("2...all", payload);
  };

  const requestFriend = async (user_id) => {
    if (!nakama.client || account.user.id === user_id) return;
    const response = await nakama.client.addFriends(nakama.session, [user_id]);
    console.log("response", response);
    setFocus(null);
  };

  useEffect(() => {
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);
  useEffect(() => {
    if (!scrollRef.current) return;
    const con = scrollRef.current;
    if (con.scrollHeight - con.clientHeight - con.scrollTop < 300) {
      con.scrollTo(0, con.scrollHeight);
    }
  }, [chats]);
  return (
    <>
      {" "}
      <div className={style.container}>
        <div>Chat</div>
        <div className={style.con_chat} ref={scrollRef}>
          {chats.length &&
            chats.map((chat, index) => (
              <div className={style.con_message} key={`chat_${index}`}>
                <div
                  className={style.chat_username}
                  onClick={() => {
                    chat.user_id !== account.user.id && setFocus(chat);
                  }}
                >
                  {chat.username}
                </div>
                <div>{chat.chat}</div>
              </div>
            ))}
        </div>
        <form onSubmit={sendChat} className={style.con_input}>
          <input
            value={chatValue}
            onChange={(ev) => setChatValue(ev.target.value)}
          ></input>
          <button type="submit">
            <SendIcon />
          </button>
        </form>
      </div>
      {focus && (
        <div className={style.con_focus}>
          <div className={style.focus_title}>{focus.username}</div>
          <div className={style.con_button}>
            <div onClick={() => requestFriend(focus.user_id)}>친구 신청</div>
            <div onClick={() => setFocus(null)}>닫기</div>
          </div>
        </div>
      )}
    </>
  );
};
export default Chat;
