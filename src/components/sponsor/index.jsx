import { tval } from '@dsplay/template-utils';
import './style.sass';

const logo = tval('sponsor_logo');

const style = {
  backgroundImage: `url("${logo}")`,
  backgroundColor: tval('sponsor_logo_box_color'),
};

function Sponsor() {
  if (!logo) return null;

  return (
    <div className="block sponsor">
      <div className="image" style={style} />
    </div>
  );
}

export default Sponsor;
