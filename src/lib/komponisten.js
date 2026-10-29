// Lebensdaten der Komponisten für den Zeitstrahl auf der Repertoire-Seite.
// Komponisten, die hier fehlen, erscheinen trotzdem in der Liste – nur nicht im Zeitstrahl.
// Neuen Komponisten ergänzen: Name genau so wie im Notenpult, dann Geburts- und ggf. Sterbejahr.
export const LEBENSDATEN = {
  'Henry Purcell': [1659, 1695],
  'Georg Philipp Telemann': [1681, 1767],
  'Johann Sebastian Bach': [1685, 1750],
  'Georg Friedrich Händel': [1685, 1759],
  'Christoph Willibald Gluck': [1714, 1787],
  'Florian Leopold Gassmann': [1729, 1774],
  'Joseph Haydn': [1732, 1809],
  'Wolfgang Amadeus Mozart': [1756, 1791],
  'Ludwig van Beethoven': [1770, 1827],
  'Gioachino Rossini': [1792, 1868],
  'Gaetano Donizetti': [1797, 1848],
  'Franz Schubert': [1797, 1828],
  'Vincenzo Bellini': [1801, 1835],
  'Felix Mendelssohn Bartholdy': [1809, 1847],
  'Frédéric Chopin': [1810, 1849],
  'Otto Nicolai': [1810, 1849],
  'Robert Schumann': [1810, 1856],
  'Franz Liszt': [1811, 1886],
  'Giuseppe Verdi': [1813, 1901],
  'Richard Wagner': [1813, 1883],
  'Anton Bruckner': [1824, 1896],
  'Johann Strauss': [1825, 1899],
  'Johann Sebastian Strauss': [1825, 1899], // so im Bestand eingetragen, gemeint ist Johann Strauss (Sohn)
  'Johannes Brahms': [1833, 1897],
  'Georges Bizet': [1838, 1875],
  'Max Bruch': [1838, 1920],
  'Modest Petrowitsch Mussorgski': [1839, 1881],
  'Pjotr Iljitsch Tschaikowski': [1840, 1893],
  'Antonín Dvořák': [1841, 1904],
  'Carl Millöcker': [1842, 1899],
  'Carl Zeller': [1842, 1898],
  'Ruggero Leoncavallo': [1857, 1919],
  'Giacomo Puccini': [1858, 1924],
  'Gustav Mahler': [1860, 1911],
  'Pietro Mascagni': [1863, 1945],
  'Richard Strauss': [1864, 1949],
  'Paul Dukas': [1865, 1935],
  'Franz Lehár': [1870, 1948],
  'Leo Fall': [1873, 1925],
  'Arnold Schönberg': [1874, 1951],
  'Manuel de Falla': [1876, 1946],
  'Emmerich Kálmán': [1882, 1953],
  'Igor Strawinsky': [1882, 1971],
  'Sergei Sergejewitsch Prokofjew': [1891, 1953],
  'Cole Porter': [1891, 1964],
  'Paul Hindemith': [1895, 1963],
  'George Gershwin': [1898, 1937],
  'Aaron Copland': [1900, 1990],
  'Frederick Loewe': [1901, 1988],
  'Dmitri Dmitrijewitsch Schostakowitsch': [1906, 1975],
  'Benjamin Britten': [1913, 1976],
  'John Kander': [1927],
  'Rodion Konstantinowitsch Schtschedrin': [1932, 2025],
  'John Williams': [1932],
  'Sylvester Levay': [1945],
};

/** „1756–1791“ bzw. „geb. 1927“ */
export function lebenszeit(name) {
  const d = LEBENSDATEN[name];
  if (!d) return '';
  return d[1] ? `${d[0]}–${d[1]}` : `geb. ${d[0]}`;
}

/** Kurzname für Plakat und Zeitstrahl: „Mozart“, „Mendelssohn Bartholdy“, „de Falla“ … */
export function kurzname(name) {
  const SONDER = {
    'Felix Mendelssohn Bartholdy': 'Mendelssohn',
    'Manuel de Falla': 'de Falla',
    'Ludwig van Beethoven': 'Beethoven',
    'Johann Sebastian Strauss': 'Johann Strauss',
    'Johann Strauss': 'Johann Strauss',
    'Richard Strauss': 'Richard Strauss',
  };
  return SONDER[name] || name.split(' ').pop();
}
