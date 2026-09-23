import male1 from "../assets/avatars/male1.png";
import male2 from "../assets/avatars/male2.png";
import female1 from "../assets/avatars/female1.png";
import female2 from "../assets/avatars/female2.png";

export const AVATAR_OPTIONS = ["male1", "male2", "female1", "female2"];

const AVATAR_IMAGES = {
  male1,
  male2,
  female1,
  female2,
};

export default function AvatarIcon({ id, className = "" }) {
  const src = AVATAR_IMAGES[id];
  if (!src) return null;

  return <img src={src} alt="" className={`avatar-icon ${className}`} />;
}