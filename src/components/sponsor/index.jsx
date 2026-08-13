import { useTemplateVal } from '@dsplay/react-template-utils';
import './style.sass';

function Sponsor() {
  const logo = useTemplateVal('sponsor_logo');
  const logoBoxColor = useTemplateVal('sponsor_logo_box_color');

  if (!logo) return null;

  const style = {
    backgroundImage: `url("${logo}")`,
    backgroundColor: logoBoxColor,
  };

  return (
    <div className="block sponsor">
      <div className="image" style={style} />
    </div>
  );
}

export default Sponsor;
