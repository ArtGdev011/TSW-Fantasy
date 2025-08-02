// TSW Fantasy League Players Database
// Each player has: name, position, region, price (in millions), overall rating (1-100)

module.exports = [
  // Goalkeepers (GK)
  { name: "Manuel Neuer", position: "GK", region: "Germany", price: 8.5, overall: 89 },
  { name: "Alisson Becker", position: "GK", region: "Brazil", price: 9.0, overall: 90 },
  { name: "Jan Oblak", position: "GK", region: "Slovenia", price: 8.0, overall: 88 },
  { name: "Thibaut Courtois", position: "GK", region: "Belgium", price: 7.5, overall: 87 },
  { name: "Ederson", position: "GK", region: "Brazil", price: 7.0, overall: 86 },
  { name: "Hugo Lloris", position: "GK", region: "France", price: 6.5, overall: 85 },
  { name: "Gianluigi Donnarumma", position: "GK", region: "Italy", price: 7.5, overall: 87 },
  { name: "Jordan Pickford", position: "GK", region: "England", price: 6.0, overall: 84 },
  { name: "Marc-André ter Stegen", position: "GK", region: "Germany", price: 8.0, overall: 88 },
  { name: "Keylor Navas", position: "GK", region: "Costa Rica", price: 5.5, overall: 83 },
  { name: "Samir Handanovic", position: "GK", region: "Slovenia", price: 5.0, overall: 82 },
  { name: "Wojciech Szczesny", position: "GK", region: "Poland", price: 6.0, overall: 84 },

  // Central Defensive Midfielders (CDM)
  { name: "N'Golo Kanté", position: "CDM", region: "France", price: 12.0, overall: 89 },
  { name: "Joshua Kimmich", position: "CDM", region: "Germany", price: 14.0, overall: 91 },
  { name: "Casemiro", position: "CDM", region: "Brazil", price: 11.5, overall: 88 },
  { name: "Fabinho", position: "CDM", region: "Brazil", price: 10.5, overall: 87 },
  { name: "Rodri", position: "CDM", region: "Spain", price: 13.0, overall: 90 },
  { name: "Declan Rice", position: "CDM", region: "England", price: 12.5, overall: 89 },
  { name: "Sergio Busquets", position: "CDM", region: "Spain", price: 9.0, overall: 86 },
  { name: "Thomas Partey", position: "CDM", region: "Ghana", price: 8.5, overall: 85 },
  { name: "Wilfred Ndidi", position: "CDM", region: "Nigeria", price: 8.0, overall: 84 },
  { name: "Marco Verratti", position: "CDM", region: "Italy", price: 11.0, overall: 88 },
  { name: "Kalvin Phillips", position: "CDM", region: "England", price: 7.5, overall: 83 },
  { name: "Aurelien Tchouameni", position: "CDM", region: "France", price: 10.0, overall: 87 },
  { name: "Tyler Adams", position: "CDM", region: "USA", price: 6.5, overall: 82 },
  { name: "Jude Bellingham", position: "CDM", region: "England", price: 15.0, overall: 92 },
  { name: "Pedri", position: "CDM", region: "Spain", price: 13.5, overall: 90 },

  // Left Wingers (LW)
  { name: "Kylian Mbappé", position: "LW", region: "France", price: 25.0, overall: 95 },
  { name: "Neymar Jr", position: "LW", region: "Brazil", price: 22.0, overall: 93 },
  { name: "Raheem Sterling", position: "LW", region: "England", price: 18.0, overall: 90 },
  { name: "Sadio Mané", position: "LW", region: "Senegal", price: 20.0, overall: 92 },
  { name: "Son Heung-min", position: "LW", region: "South Korea", price: 19.0, overall: 91 },
  { name: "Jadon Sancho", position: "LW", region: "England", price: 16.0, overall: 88 },
  { name: "Kingsley Coman", position: "LW", region: "France", price: 15.0, overall: 87 },
  { name: "Marcus Rashford", position: "LW", region: "England", price: 17.0, overall: 89 },
  { name: "Phil Foden", position: "LW", region: "England", price: 16.5, overall: 88 },
  { name: "Jack Grealish", position: "LW", region: "England", price: 14.0, overall: 86 },
  { name: "Ansu Fati", position: "LW", region: "Spain", price: 13.0, overall: 85 },
  { name: "Rafael Leão", position: "LW", region: "Portugal", price: 12.5, overall: 84 },
  { name: "Vinícius Jr", position: "LW", region: "Brazil", price: 21.0, overall: 92 },
  { name: "Leroy Sané", position: "LW", region: "Germany", price: 15.5, overall: 87 },
  { name: "Christian Pulisic", position: "LW", region: "USA", price: 11.0, overall: 83 },

  // Right Wingers (RW)
  { name: "Lionel Messi", position: "RW", region: "Argentina", price: 24.0, overall: 94 },
  { name: "Mohamed Salah", position: "RW", region: "Egypt", price: 23.0, overall: 93 },
  { name: "Riyad Mahrez", position: "RW", region: "Algeria", price: 17.0, overall: 89 },
  { name: "Angel Di María", position: "RW", region: "Argentina", price: 14.0, overall: 86 },
  { name: "Bukayo Saka", position: "RW", region: "England", price: 16.0, overall: 88 },
  { name: "Serge Gnabry", position: "RW", region: "Germany", price: 15.0, overall: 87 },
  { name: "Federico Chiesa", position: "RW", region: "Italy", price: 13.5, overall: 85 },
  { name: "Ousmane Dembélé", position: "RW", region: "France", price: 12.0, overall: 84 },
  { name: "Mason Mount", position: "RW", region: "England", price: 11.5, overall: 83 },
  { name: "Antony", position: "RW", region: "Brazil", price: 14.5, overall: 86 },
  { name: "Raphinha", position: "RW", region: "Brazil", price: 13.0, overall: 85 },
  { name: "Jarrod Bowen", position: "RW", region: "England", price: 10.0, overall: 82 },
  { name: "Pedro Neto", position: "RW", region: "Portugal", price: 9.5, overall: 81 },
  { name: "Dani Olmo", position: "RW", region: "Spain", price: 12.5, overall: 84 },
  { name: "Cody Gakpo", position: "RW", region: "Netherlands", price: 11.0, overall: 83 }
];
