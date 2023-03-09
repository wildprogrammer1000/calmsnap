import { useState, useEffect } from "react";
import { nakama } from "../../util/nakama";
import { useSelector } from "react-redux";
import { ability } from "../../data/card";
import style from "./Collection.module.css";

const Collection = ({ refreshAccount }) => {
  const account = useSelector((state) => state.default.value);
  const [wallet, setWallet] = useState({});
  const [userMetadata, setUserMetadata] = useState({});
  const [focus, setFocus] = useState();

  const [selectedDeck, setSelectedDeck] = useState();

  const [deletePopup, setDeletePopup] = useState(false);

  const addDeck = async () => {
    const result = await nakama.socket.rpc("add_deck");
    if (!result.payload) return;
    const payload = JSON.parse(result.payload);
    if (payload.success) refreshAccount();
    console.log("result", result);
  };

  const selectDeck = (index) => {
    setSelectedDeck(index);
  };
  const addToDeck = async () => {
    if (!focus) return;
    const result = await nakama.socket.rpc(
      "modify_deck",
      JSON.stringify({
        deck_index: selectedDeck,
        card: focus,
      })
    );
    if (!result.payload) return;
    const { success } = JSON.parse(result.payload);
    if (success) {
      refreshAccount();
      console.log(1);
      setFocus(null);
    }
  };
  const deleteDeck = async () => {
    const result = await nakama.socket.rpc(
      "delete_deck",
      JSON.stringify({ index: selectedDeck })
    );
    console.log("delete result", result);
    if (!result.payload) return;
    const { success } = JSON.parse(result.payload);
    if (success) {
      refreshAccount();
      setDeletePopup(false);
      setSelectedDeck(null);
    }
  };
  const checkDuplication = () => {
    const duplicated = userMetadata.deck[selectedDeck - 1].find(
      (el) => el === focus
    );
    console.log(duplicated);
    if (duplicated) return true;
    else return false;
  };
  useEffect(() => {
    if (account) {
      setWallet(JSON.parse(account.wallet));
      setUserMetadata(JSON.parse(account.user.metadata));
    }
  }, [account]);
  useEffect(() => {
    console.log("selected deck", selectedDeck);
  }, [selectedDeck]);
  if (!account) return null;
  return (
    <div className={style.container}>
      {selectedDeck ? (
        <>
          <div className={style.header}>
            <div onClick={() => setSelectedDeck(null)}>뒤로가기</div>
            <div className={style.title}>덱{selectedDeck}</div>
            <div onClick={() => setDeletePopup(true)}>삭제</div>
          </div>
          <div className={style.deck_container}>
            {userMetadata.deck ? (
              <div className={style.slot_container}>
                {userMetadata.deck[selectedDeck - 1].map((card, index) => (
                  <div
                    key={`card_${index}`}
                    className={
                      card !== "" ? style.card_slot : style.card_slot_empty
                    }
                  >
                    {card !== "" && (
                      <img src={`card/${card}.png`} width="100%" alt="card" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={style.deck_cell} onClick={addDeck}>
                +
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className={style.header}>
            <div className={style.title}>카드</div>
          </div>
          <div className={style.deck_container}>
            {userMetadata.deck ? (
              <div className={style.deck_cell}>
                {userMetadata.deck.map(
                  (deck, index) => (
                    <div
                      key={`deck_${index}`}
                      onClick={() => selectDeck(index + 1)}
                    >
                      덱{index + 1}
                    </div>
                  )
                  // deck.map((card) =>
                  //   card !== "" ? (
                  //     <div>카드 o</div>
                  //   ) : (
                  //     <div className={style.card_slot}></div>
                  //   )
                  // )
                )}
              </div>
            ) : (
              <div className={style.deck_cell} onClick={addDeck}>
                +
              </div>
            )}
          </div>
        </>
      )}
      <div className={style.body}>
        {Object.keys(wallet).length > 0 &&
          Object.keys(wallet).map((card, index) => {
            if (card === "draw") return null;
            if (card === "point") return null;
            return (
              <div
                key={`card_${index}`}
                onClick={() => setFocus(card)}
                className={style.con_card}
              >
                <div className={style.square_cost}>
                  <div className={style.card_cost}>
                    <div>{ability[card].cost}</div>
                  </div>
                </div>
                <div className={style.square_power}>
                  <div className={style.card_power}>
                    <div>{ability[card].power}</div>
                  </div>
                </div>
                <img
                  src={`card/${card}.png`}
                  width="100%"
                  alt="card"
                />
              </div>
            );
          })}
      </div>
      {focus && (
        <div className={style.focus_container}>
          <div className={style.focus}>
            <img src={`card/${focus}.png`} height="100%" alt="card" />
          </div>
          <div
            className={
              selectedDeck ? style.focus_deck_on : style.focus_deck_off
            }
            onClick={addToDeck}
          >
            {selectedDeck
              ? checkDuplication()
                ? "덱에서 제거"
                : "덱에 추가"
              : "선택된 덱 없음"}
          </div>
        </div>
      )}
      {(focus || deletePopup) && (
        <div
          onClick={() => {
            setFocus(null);
            setDeletePopup(false);
          }}
          className={style.background}
        ></div>
      )}
      {deletePopup && (
        <div className={style.center_popup}>
          <div className={style.popup_title}>덱을 삭제하시겠습니까?</div>
          <div className={style.button_container}>
            <div
              className={style.button_white}
              onClick={() => setDeletePopup(false)}
            >
              아니요
            </div>
            <div className={style.button_yellow} onClick={deleteDeck}>
              네
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Collection;
