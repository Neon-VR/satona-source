import { useEffect, useState, useSyncExternalStore } from "react";
import Icon from "../components/Icon";
import {
  getAccountState,
  subscribeAccount,
  signIntoAccount,
  saveAccount,
  restoreAccount,
  signOutAccount,
  checkAccountService,
} from "../lib/account-sync";
import "./account.css";
export default function Account() {
  const state = useSyncExternalStore(subscribeAccount, getAccountState);
  useEffect(() => {
    void checkAccountService();
  }, []);
  const [create, setCreate] = useState(false),
    [username, setUsername] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [sessions, setSessions] = useState(true);
  return (
    <section className="satona-account">
      <div className="account-hero">
        <span>
          <Icon name="cloud" size={32} />
        </span>
        <small>ONE ACCOUNT. YOUR WHOLE SPACE.</small>
        <h1>
          Pick up where
          <br />
          you left off.
        </h1>
        <p>
          Your bookmarks, history, favorites, and browser preferences. Encrypted
          before they leave your device.
        </p>
      </div>
      <div className="account-panel">
        <h2>
          {state.unlocked
            ? "Your Satona account"
            : create
              ? "Create an account"
              : "Welcome back"}
        </h2>
        <p className="account-status" role="status">
          {state.status}
        </p>
        {!state.available && (
          <button
            className="account-toggle"
            onClick={() => void checkAccountService()}
          >
            Check availability again
          </button>
        )}
        {state.unlocked ? (
          <>
            <strong className="account-email">{state.username}</strong>
            <div className="account-facts">
              <span>
                Cloud backup <b>Encrypted</b>
              </span>
              <span>
                Website sessions{" "}
                <b>{state.includeSessions ? "Included" : "Not included"}</b>
              </span>
              <span>
                Last saved{" "}
                <b>
                  {state.lastSync
                    ? new Date(state.lastSync).toLocaleString()
                    : "Not yet saved"}
                </b>
              </span>
            </div>
            <p>
              Changes save every 30 seconds while this page stays open. On
              another device, sign in to restore the latest backup. Restoring
              closes open apps.
            </p>
            <div className="account-actions">
              <button
                disabled={state.busy || state.conflict}
                onClick={() => void saveAccount(true)}
              >
                Save now
              </button>
              <button
                disabled={state.busy}
                onClick={() => void restoreAccount()}
              >
                Restore cloud backup
              </button>
            </div>
            <button
              className="account-signout"
              disabled={state.busy}
              onClick={() => void signOutAccount()}
            >
              Sign out & clear synced data on this device
            </button>
            <p className="account-note">
              Closing this tab locks cloud sync. Sign in again to resume it;
              website sessions already restored on this device stay until you
              sign out above.
            </p>
          </>
        ) : (
          <>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await signIntoAccount(
                  username,
                  password,
                  sessions,
                  create,
                  email,
                );
                setPassword("");
              }}
            >
              <label>
                Username
                <input
                  required
                  autoComplete="username"
                  minLength={3}
                  maxLength={24}
                  pattern="[A-Za-z0-9_]{3,24}"
                  title="3–24 letters, numbers, or underscores"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>
              {create && (
                <label>
                  Email (optional)
                  <input
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <small>
                    You can leave this empty. Sign in with your username.
                  </small>
                </label>
              )}
              <label>
                Password
                <input
                  required
                  minLength={create ? 12 : undefined}
                  type="password"
                  autoComplete={create ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {create && (
                <small>Use at least 12 characters and a unique password.</small>
              )}
              <label className="account-check">
                <input
                  type="checkbox"
                  checked={sessions}
                  onChange={(e) => setSessions(e.target.checked)}
                />
                <span>
                  Include website logins from Satona Browser
                  <small>
                    Encrypt and sync proxy cookies and website storage. Use only
                    on devices you trust.
                  </small>
                </span>
              </label>
              <button disabled={state.busy || !state.available}>
                {state.busy
                  ? "Please wait…"
                  : create
                    ? "Create Satona account"
                    : "Sign in & restore"}
              </button>
            </form>
            <button
              className="account-toggle"
              disabled={state.busy}
              onClick={() => setCreate(!create)}
            >
              {create
                ? "Already have an account? Sign in"
                : "New to Satona? Create an account"}
            </button>
            <p className="account-note">
              Keep your username and password safe. Your password unlocks your
              encrypted backup; password recovery is not available yet.
            </p>
          </>
        )}
        <div className="account-limits">
          <Icon name="lock" size={16} />
          <p>
            Only data inside Satona is synced. Google, NVIDIA, and other sites
            may require a fresh sign-in on a new device. Device-bound
            credentials, passkeys, IndexedDB, and game saves are not
            transferred.
          </p>
        </div>
      </div>
    </section>
  );
}
