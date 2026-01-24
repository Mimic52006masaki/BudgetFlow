<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 主要ファイル

このプロジェクトの主要なファイルとディレクトリは以下の通りです。

- `App.tsx`: アプリケーションのメインコンポーネント。ルーティングとグローバルなレイアウトを定義します。
- `index.tsx`: アプリケーションのエントリーポイント。ReactアプリをDOMにマウントします。
- `constants.ts`: アプリケーション全体で使用される定数を定義します。
- `firebase.ts`: Firebaseの初期化と設定が含まれます。
- `types.ts`: アプリケーション全体で使用されるTypeScriptの型定義が含まれます。
- `vite.config.ts`: Viteビルドツールの設定ファイルです。
- `components/`: UIコンポーネントを格納するディレクトリ。
    - `Dashboard.tsx`: メインのダッシュボード画面コンポーネント。
    - `Login.tsx`: ユーザー認証（ログイン）コンポーネント。
    - `Header.tsx`: アプリケーションのヘッダーコンポーネント。
- `contexts/`: React Context APIを使用したグローバルステート管理のためのディレクトリ。
    - `AuthContext.tsx`: 認証状態を管理するコンテキスト。
- `hooks/`: カスタムReactフックを格納するディレクトリ。
    - `useAccounts.ts`: アカウント関連のロジックをカプセル化したフック。
    - `useHistory.ts`: 履歴データ関連のロジックをカプセル化したフック。
    - `useMonthlyCosts.ts`: 月間コスト関連のロジックをカプセル化したフック。
    - `useSalaryPeriods.ts`: 給与期間関連のロジックをカプセル化したフック。
    - `useTemplates.ts`: テンプレート関連のロジックをカプセル化したフック。
- `utils/`: ユーティリティ関数を格納するディレクトリ。
    - `analytics.ts`: アナリティクス関連のユーティリティ関数。