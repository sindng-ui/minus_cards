import { useNetworkGame } from './hooks/useNetworkGame';
import { LobbyScreen } from './components/LobbyScreen';
import { GameBoard } from './components/GameBoard';

export function App() {
  const {
    myPlayerId,
    myName,
    setMyName,
    isHost,
    connectionStatus,
    errorMessage,
    gameState,
    activeEmojis,
    createRoom,
    joinRoom,
    updateSettings,
    addBotPlayer,
    removePlayer,
    startGame,
    rollMyDice,
    passTurnWithCoin,
    takeCenterCard,
    sendEmoji,
    returnToLobby,
  } = useNetworkGame();

  if (
    !gameState ||
    connectionStatus !== 'CONNECTED' ||
    gameState.phase === 'LOBBY'
  ) {
    return (
      <LobbyScreen
        myPlayerId={myPlayerId}
        myName={myName}
        setMyName={setMyName}
        isHost={isHost}
        connectionStatus={connectionStatus}
        errorMessage={errorMessage}
        gameState={gameState}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onUpdateSettings={updateSettings}
        onAddBot={addBotPlayer}
        onRemovePlayer={removePlayer}
        onStartGame={startGame}
      />
    );
  }

  return (
    <GameBoard
      gameState={gameState}
      myPlayerId={myPlayerId}
      isHost={isHost}
      activeEmojis={activeEmojis}
      onRollDice={rollMyDice}
      onPassWithCoin={passTurnWithCoin}
      onTakeCard={takeCenterCard}
      onSendEmoji={sendEmoji}
      onPlayAgain={startGame}
      onReturnToLobby={returnToLobby}
    />
  );
}

export default App;
