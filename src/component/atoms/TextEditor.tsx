import React, { useEffect } from "react";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

interface TextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: string;
  readOnly?: boolean;
  modules?: any;
  formats?: string[];
}

const TextEditor: React.FC<TextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter content...",
  height = "200px",
  readOnly = false,
  modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  },
  formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "link",
    "image",
  ],
}) => {
  const { quill, quillRef } = useQuill({
    theme: "snow",
    modules,
    formats,
    placeholder,
    readOnly,
  });

  // Set initial value and handle changes
  useEffect(() => {
    if (quill) {
      // Set initial value (only once or when value changes)
      if (value && quill.root.innerHTML !== value) {
        quill.root.innerHTML = value;
      }

      // Listen for content changes
      const handleChange = () => {
        const html = quill.root.innerHTML;
        onChange(html);
      };

      quill.on("text-change", handleChange);

      return () => {
        quill.off("text-change", handleChange);
      };
    }
  }, [quill, value, onChange]);

  return (
    <div style={{ height }}>
      <div ref={quillRef} style={{ height: "100%" }} />
    </div>
  );
};

export default TextEditor;
