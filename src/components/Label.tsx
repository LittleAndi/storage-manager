import React from "react";
import QRCode from "react-qr-code";
import "./Label.css";

type LabelProps = {
  url: string;
  text: string;
};

export const Label: React.FC<LabelProps> = ({ url, text }) => (
  <div className="label">
    <div className="qr-wrapper">
      <QRCode value={url} size={90} />
    </div>
    <div className="label-text">{text}</div>
  </div>
);
