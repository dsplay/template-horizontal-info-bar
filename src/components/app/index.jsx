import { useTemplateVal } from '@dsplay/react-template-utils';
import Clock from '../clock';
import Quotes from '../quotes';
import News from '../news';
import Weather from '../weather';
import Sponsor from '../sponsor';
import './style.sass';

// c - clock
// w - weather
// q - quotes
// n - news
// s - sponsor

const mapWidgets = {
  c: <Clock key="clock" />,
  w: <Weather key="weather" />,
  q: <Quotes key="quotes" />,
  n: <News key="news" />,
  s: <Sponsor key="sponsor" />,
};

const defaultSequenceWidgets = ['s', 'w', 'q', 'n', 'c'];

const filterWidgetsSequence = (sequence) => {
  const widgetsSequence = [];

  sequence.forEach((element) => {
    if (defaultSequenceWidgets.includes(element) && !widgetsSequence.includes(element)) {
      widgetsSequence.push(element);
    }
  });

  defaultSequenceWidgets.forEach((element) => {
    if (!widgetsSequence.includes(element)) {
      widgetsSequence.push(element);
    }
  });

  return widgetsSequence;
};

function App() {
  const backgroundColor = useTemplateVal('bg_color', 'white');
  const bgImage = useTemplateVal('bg_image');
  const color = useTemplateVal('text_color', 'black');
  const widgetsSequenceQuery = useTemplateVal('widgets_sequence_query', defaultSequenceWidgets.join(','));

  const style = {
    backgroundColor,
    backgroundImage: bgImage ? `url('${bgImage}')` : undefined,
    color,
  };

  const widgetsSequence = widgetsSequenceQuery
    ? filterWidgetsSequence([...widgetsSequenceQuery.toLowerCase()])
    : defaultSequenceWidgets;
  const widgets = widgetsSequence.map((element) => mapWidgets[element]);

  return (
    <div className="App block" style={style}>
      {widgets}
    </div>
  );
}

export default App;
