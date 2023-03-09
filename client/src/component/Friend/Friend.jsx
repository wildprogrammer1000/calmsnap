import { useState, useEffect } from "react";
import { nakama } from "../../util/nakama";
import { useSelector } from "react-redux";
import style from "./Friend.module.css";

const Friend = () => {
  const account = useSelector((state) => state.default.value);
  const [link, setLink] = useState();
  const state = {
    0: "삭제",
    1: "요청됨",
    2: "수락",
    3: "차단해제",
  };
  const [popup, setPopup] = useState();
  const [friends, setFriends] = useState([]);
  const getFriends = async () => {
    if (!nakama.client) return;
    const response = await nakama.client.listFriends(nakama.session);
    console.log("response", response);
    setFriends(response.friends);
  };
  const handleEvent = async (state, user_id) => {
    if (!nakama.client) return;
    switch (state) {
      case 0:
      case 1:
        setPopup({ state: state, user_id: user_id });
        break;
      case 2:
        const added = await nakama.client.addFriends(nakama.session, [user_id]);
        if (added) getFriends();
        break;

      default:
    }
  };
  const deleteFriend = async (user_id) => {
    if (!nakama.client) return;
    const deleted = await nakama.client.deleteFriends(nakama.session, [
      user_id,
    ]);
    if (deleted) {
      getFriends();
      setPopup(null);
    }
  };
  const saveToClipboard = async (link) => {
    if (!navigator.clipboard) return;
    const response = await navigator.clipboard.writeText(link);
    console.log("response", response);
  };
  useEffect(() => {
    getFriends();
  }, []);
  return (
    <>
      <div>
        <div className={style.tabmenu}>
          <div>친구목록</div>
          <div>받은 요청</div>
          <div onClick={() => setLink(true)}>초대 링크</div>
        </div>
        <div>
          {friends.length ? (
            friends.map((friend, index) => (
              <div key={`friend_${index}`}>
                <div>{friend.user.username}</div>
                <div onClick={() => handleEvent(friend.state, friend.user.id)}>
                  {state[friend.state]}
                </div>
              </div>
            ))
          ) : (
            <div>친구를 추가해보세요!</div>
          )}
        </div>
      </div>

      {popup && (
        <div className={style.con_popup}>
          <div>친구를 삭제하시겠어요?</div>
          <div className={style.con_button}>
            <div onClick={() => deleteFriend(popup.user_id)}>네</div>
            <div onClick={() => setPopup(null)}>아니오</div>
          </div>
        </div>
      )}
      {link && (
        <div className={style.con_popup}>
          <div>{`${window.origin}/?inviter=${account.user.id}`}</div>
          <div
            onClick={() =>
              saveToClipboard(`${window.origin}/?inviter=${account.user.id}`)
            }
          >
            복사
          </div>
        </div>
      )}
    </>
  );
};
export default Friend;
