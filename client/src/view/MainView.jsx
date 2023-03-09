import { useEffect, useState } from "react";
import Shop from "../component/Shop/Shop";
import Main from "../component/Main/Main";
import Chat from "../component/Chat/Chat";
import Friend from "../component/Friend/Friend";
import Collection from "../component/Collection/Collection";

import style from "./View.module.css";

const MainView = ({ setView, refreshAccount }) => {
  const [menu, setMenu] = useState(0);
  useEffect(() => {
    console.log("component mount");
    return () => {
      console.log("component unmounted");
    };
  }, []);
  return (
    <div className={style.wrapper}>
      <div className={style.view}>
        {menu === 0 && <Shop />}
        {menu === 1 && <Collection refreshAccount={refreshAccount} />}
        {menu === 2 && (
          <Main refreshAccount={refreshAccount} setView={setView} />
        )}
        {menu === 3 && <Chat />}
        {menu === 4 && <Friend />}
        {menu === 5 && <Shop />}
      </div>
      <div className={style.nav_bar}>
        <div
          className={menu === 0 ? style.menu_on : style.menu_off}
          onClick={() => setMenu(0)}
        >
          상점
        </div>
        <div
          className={menu === 1 ? style.menu_on : style.menu_off}
          onClick={() => setMenu(1)}
        >
          카드
        </div>
        <div
          className={menu === 2 ? style.menu_on : style.menu_off}
          onClick={() => setMenu(2)}
        >
          메인
        </div>
        <div
          className={menu === 3 ? style.menu_on : style.menu_off}
          onClick={() => setMenu(3)}
        >
          채팅
        </div>
        <div
          className={menu === 4 ? style.menu_on : style.menu_off}
          onClick={() => setMenu(4)}
        >
          친구
        </div>
      </div>
    </div>
  );
};
export default MainView;
