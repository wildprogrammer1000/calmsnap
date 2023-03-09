import { useEffect } from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { nakama } from "../../util/nakama";
import Notification from "../Notification/Notification";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import style from "./Main.module.css";

const Main = ({ setView, refreshAccount }) => {
  const account = useSelector((state) => state.default.value);
  const [userMetadata, setUserMetadata] = useState(null);
  const [currentDeck, setCurrentDeck] = useState(null);
  const [needDeck, setNeedDeck] = useState(false);
  const [needCard, setNeedCard] = useState(false);
  const [noDeck, setNoDeck] = useState(false);
  const [decksOpen, setDecksOpen] = useState(false);
  const [notification, setNotification] = useState(false);

  const findMatch = () => {
    if (!currentDeck) {
      setNeedDeck(true);
      return;
    } else {
      const deck = userMetadata.deck[currentDeck - 1];
      let cardCheck = deck.find((el) => el === "");
      if (cardCheck === "") {
        setNeedCard(true);
        return;
      }
    }
    setView(2);
  };

  const showDecks = () => {
    userMetadata.deck ? setDecksOpen(true) : setNoDeck(true);
  };
  const selectDeck = async (index) => {
    const result = await nakama.socket.rpc(
      "select_deck",
      JSON.stringify({ index: index })
    );
    if (!result.payload) return;
    const { success } = JSON.parse(result.payload);
    if (success) {
      refreshAccount();
      setCurrentDeck(index);
      setDecksOpen(false);
    }
  };

  useEffect(() => {
    if (account) {
      const temp = JSON.parse(account.user.metadata);
      setUserMetadata(temp);
      if (temp.current_deck) setCurrentDeck(temp.current_deck);
    }
  }, [account]);
  useEffect(() => {
    refreshAccount();
  }, []);
  return (
    <>
      <div className={style.container}>
        <div className={style.header}>
          <div className={style.title}>메인</div>
          <div>
            승률{" "}
            {userMetadata &&
              (userMetadata.total_game
                ? userMetadata.win_count
                  ? `${(
                      (userMetadata.win_count / userMetadata.total_game) *
                      100
                    ).toFixed(2)}%`
                  : "0%"
                : "-")}
          </div>
          <div onClick={() => setNotification(true)}>알림</div>
        </div>
        <div className={style.play}>
          <div className={style.deck} onClick={showDecks}>
            {currentDeck ? (
              `덱${currentDeck}`
            ) : (
              <ReportProblemIcon className={style.color_red} />
            )}
          </div>
          <span onClick={findMatch}>플레이</span>
        </div>
      </div>
      {needDeck && (
        <div className={style.center_popup}>
          <div>덱을 선택해주세요.</div>
          <div onClick={() => setNeedDeck(false)}>확인</div>
        </div>
      )}
      {decksOpen && (
        <div className={style.center_popup_full}>
          {userMetadata.deck.map((deck, index) => (
            <div
              key={`deck_${index + 1}`}
              onClick={() => selectDeck(index + 1)}
            >
              덱 {index + 1}
            </div>
          ))}
          <div></div>
        </div>
      )}
      {noDeck && (
        <div className={style.center_popup}>
          <div>덱 없음</div>
          <div onClick={() => setNoDeck(false)}>확인</div>
        </div>
      )}
      {needCard && (
        <div className={style.center_popup}>
          <div>미완성 덱</div>
          <div>덱에 카드를 추가해주세요.</div>
          <div onClick={() => setNeedCard(false)}>확인</div>
        </div>
      )}
      {notification && (
        <Notification
          refreshAccount={refreshAccount}
          close={() => setNotification(false)}
        />
      )}
    </>
  );
};
export default Main;
