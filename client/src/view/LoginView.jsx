import { useEffect } from "react";
import { Client } from "@heroiclabs/nakama-js";
import { nakama } from "../util/nakama";
import { uuid, username } from "../util/fn";
import { useDispatch } from "react-redux";
import { refresh } from "../util/account";

import style from "./View.module.css";

const LoginView = ({ setView, joinChat }) => {
  const dispatch = useDispatch();
  const start = () => {
    window.gapi.auth2.init({
      apiKey: process.env.REACT_APP_GOOGLE_APIKEY,
      discoveryDocs: ["https://people.googleapis.com/$discovery/rest"],
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      scope: "profile",
    });
  };
  const guestLogin = async (stored) => {
    const id = stored || uuid();
    const client = new Client("defaultkey", "localhost", 7350, false);
    const socket = client.createSocket();

    const session = await client.authenticateCustom(id, true, username());
    // const session = await client.authenticateCustom(id, true, id);
    if (session) {
      // localStorage.setItem("guest", id);
      const connected = await socket.connect(session);
      const set = nakama.set(client, session, socket);
      connected && set && setView(1);

      const account = await nakama.getAccount();
      dispatch(refresh(account));
    }
  };
  const checkUrl = async () => {
    const url = window.location.href;
    const newUrl = new URL(url);
    const params = newUrl.searchParams;
    const inviter = params.get("inviter");
    if (!inviter) return;
    const response = await nakama.socket.rpc(
      "add_inviter",
      JSON.stringify({ user_id: inviter })
    );
    console.log("response", response);
  };
  const testLogin = async (id) => {
    const client = new Client("defaultkey", "localhost", 7350, false);
    const socket = client.createSocket();

    const session = await client.authenticateCustom(id, true, username());
    if (session) {
      // localStorage.setItem("guest", id);
      const connected = await socket.connect(session);
      const set = nakama.set(client, session, socket);
      if (connected && set) {
        setView(1);
        joinChat();
        checkUrl();
      }

      const account = await nakama.getAccount();
      dispatch(refresh(account));
    }
  };
  const test2Login = async (id) => {
    const client = new Client("defaultkey", "localhost", 7350, false);
    const socket = client.createSocket();

    const session = await client.authenticateCustom(id, true, username());
    if (session) {
      // localStorage.setItem("guest", id);
      const connected = await socket.connect(session);
      const set = nakama.set(client, session, socket);
      if (connected && set) {
        setView(100);
        joinChat();
      }

      const account = await nakama.getAccount();
      dispatch(refresh(account));
    }
  };
  const handleGoogleLogin = async (data) => {
    const client = new Client("defaultkey", "localhost", 7350, false);
    const socket = client.createSocket();
    const session = await client.authenticateGoogle(
      data.credential,
      true,
      username()
    );
    if (session) {
      // localStorage.setItem("guest", id);
      const connected = await socket.connect(session);
      const set = nakama.set(client, session, socket);
      if (connected && set) {
        setView(1);
        joinChat();
      }

      const account = await nakama.getAccount();
      dispatch(refresh(account));
    }
  };
  useEffect(() => {
    window.login = handleGoogleLogin;
    window.onload = () => {
      window.google.accounts.id.initialize({
        client_id:
          "125955859940-ubta1gbnlp4aba57im2krq3uv6a9hhvs.apps.googleusercontent.com",
        callback: handleGoogleLogin,
      });
      window.google.accounts.id.prompt();
    };
  }, []);
  return (
    <div className={style.container}>
      {/* <div className={style.title}>자유 개발</div>
      <div
        className={style.login}
        onClick={() => test2Login("1234-1234-1234-123a")}
      >
        테스트
      </div> */}
      <div className={style.title}>침착한 스냅</div>
      <div className={style.login}>
        {/* <div onClick={() => testLogin("1234-1234-1234-123a")}>
          TEST_ACCOUNT_1
        </div>
        <div onClick={() => testLogin("1234-1234-1234-123b")}>
          TEST_ACCOUNT_2
        </div> */}
        <div>
          <div
            id="g_id_onload"
            data-client_id="125955859940-ubta1gbnlp4aba57im2krq3uv6a9hhvs.apps.googleusercontent.com"
            data-context="signin"
            data-ux_mode="popup"
            data-login_uri="http://localhost:3000"
            data-itp_support="true"
            data-callback="login"
          ></div>

          <div
            className="g_id_signin"
            data-type="icon"
            data-shape="circle"
            data-theme="outline"
            data-text="signin_with"
            data-size="large"
          ></div>
        </div>
      </div>
    </div>
  );
};
export default LoginView;
