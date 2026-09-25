import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";
import avatar4 from "../assets/avatars/avatar4.png";

export const AVATAR_OPTIONS = ["avatar1", "avatar2", "avatar3", "avatar4"];

const AVATAR_IMAGES = {
  avatar1,
  avatar2,
  avatar3,
  avatar4,
};

export default function AvatarIcon({ id, className = "" }) {
  const src = AVATAR_IMAGES[id];
  if (!src) return null;

  return <img src={src} alt="" className={`avatar-icon ${className}`} />;
}