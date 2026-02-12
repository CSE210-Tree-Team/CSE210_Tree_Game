import { Popup } from "../../components/Popup";

export const WaterGame = () => {
  return (
    <div>
      <h1>Water Game</h1>
      <Popup
        variant="water"
        screen="start"
        header="Welcome To"
        buttonText="Play"
        title="RAINDROP RUSH"
        onClick={() => (window.location.href = "/")}
      />
      <Popup
        variant="soil"
        screen="start"
        header="Welcome To"
        buttonText="Play"
        title="DOWN TO THE ROOTS"
        onClick={() => (window.location.href = "/")}
      />
      <Popup
        variant="water"
        screen="tutorial"
        header="How To Play"
        buttonText="I'm Ready"
        onClick={() => (window.location.href = "/")}
        textList={[
          "Click and drag your bucket under a raindrop to collect it",
          "Collect the raindrop which correctly answers the question at the top of the screen",
          "Goal: Collect as many raindrops as you can!",
        ]}
      />
      <Popup
        variant="soil"
        screen="tutorial"
        header="How To Play"
        buttonText="I'm Ready"
        onClick={() => (window.location.href = "/")}
        textList={[
          "You are in a dungeon underground with various rooms and have been given 3 quests",
          "Each room may contain an answer to a quest",
          "Type the number of the correct corresponding quest to collect that answer",
          "Goal: Collect the answers to all 3 quests",
        ]}
      />
      <Popup
        variant="water"
        screen="end"
        header="Time's Up"
        buttonText="Go Back to Home"
        onClick={() => (window.location.href = "/")}
        textList={[
          "Number of correctly answered questions: 7",
          "Number of incorrectly answered questions: 3",
          "Total number of points earned: 7",
        ]}
      />
      <Popup
        variant="soil"
        screen="end"
        header="Mission Complete"
        buttonText="Go Back to Home"
        onClick={() => (window.location.href = "/")}
        textList={[
          "You are in a dungeon underground with various rooms and have been given 3 quests",
          "Each room may contain an answer to a quest",
          "Type the number of the correct corresponding quest to collect that answer",
          "Goal: Collect the answers to all 3 quests",
        ]}
      />{" "}
    </div>
  );
};
