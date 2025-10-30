import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from "./redux/store";
import Shell from "./Shell";
import FirebaseErrorBoundary from "./component/atoms/FirebaseErrorBoundary";
import "./App.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.Fragment>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <FirebaseErrorBoundary>
          <Shell />
        </FirebaseErrorBoundary>
      </PersistGate>
    </Provider>
  </React.Fragment>
);
