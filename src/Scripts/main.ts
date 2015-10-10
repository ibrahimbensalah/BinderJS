import Xania = require("xania");

var personBinder = new Xania.Binder();

personBinder
    .bind(document.getElementById("container"), {})
    .update({ person: { firstName: "Ibrahim", lastName: "ben Salah" } })
    .updateDom();


export class Calendar {
    setCell(day, hour, results) {
        var cell = new Cell(day, hour);
        cell.setResults(results);

        if (!this[day])
            this[day] = {};
        this[day][hour] = cell;

        return this[day][hour];
    }

    getCell(day, hour, results) {
        var cell = new Cell(day, hour);
        cell.setResults(results);

        return cell;
    }
}

export class Cell {
    day: number;
    hour: number;
    style: any;
    status: any = {};
    isPure: boolean = true;

    constructor(day, hour) {
        this.day = day;
        this.hour = hour;
        this.style = {
            showHour: "",
            showSpinner: "display: none",
            showSearchResults: "display: none"
        };
    }
    get hours(): string {
        return ("00" + (this.hour + 1)).slice(-2);
    }

    setResults(results: number) {
        this.style = {
            showHour: "display: none",
            showSpinner: "display: none",
            showSearchResults: ""
        };
        this.status = {
            searchResults: {
                options: Math.floor(results * 10)
            }
        }
    }

    get cellClass() {
        if (this.status.isSearching) {
            return 'searching';
        } else if (this.status.searchResults) {
            if (this.status.searchResults.options > 3) {
                return 'good-results';
            } else if (this.status.searchResults.options > 1) {
                return 'weak-results';
            } else {
                return 'bad-results';
            }
        }
    }
}