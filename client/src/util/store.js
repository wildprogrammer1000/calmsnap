import { configureStore } from "@reduxjs/toolkit";
import * as account from "./account";

export default configureStore({
  reducer: account,
});
