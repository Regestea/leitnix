import MainContainer from "../../shared/components/MainContainer";
import MarkdownEditor from "../../shared/components/MarkdownEditor";
export default function LearnTopic() {
  return (
    <MainContainer>
      <div style={{ overflow: "scroll", maxHeight: "80dvh" }}>
        <MarkdownEditor />
      </div>
    </MainContainer>
  );
}
