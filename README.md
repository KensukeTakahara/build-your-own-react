# build-your-own-react

## 概要

[Build your own React](https://pomb.us/build-your-own-react/) を参考に React, ReactDOM の API の一部を TypeScript で自力実装。

## 実装した API

- React.createElement
- React.useState
- ReactDOM.render

## 実装した機能

- 仮想 DOM
- 差分検出処理
- Hooks (useState のみ)

## 解説記事

- [前半](https://qiita.com/KensukeTakahara/items/9c54e68fea06ce3e4efe)
- 後半 まだです……

## ビルド手順

1. src/index.tsx に JSX を記述する
1. `yarn build` を実行する
1. dist/bundle.js としてアプリが生成される
1. index.html をブラウザで開くとアプリが読み込まれる

