define(["require", "exports", "xania"], function (require, exports, Xania) {
    var personBinder = new Xania.Binder();
    //personBinder
    //    .bind(document.getElementById("container"))
    //    .update([], { person: { firstName: "Ibrahim", lastName: "ben Salah" } })
    //    .updateDom();
    var Calendar = (function () {
        function Calendar() {
        }
        Calendar.prototype.setCell = function (day, hour, results) {
            if (!this[day])
                this[day] = {};
            if (!this[day][hour])
                this[day][hour] = new Cell(day, hour);
            var cell = this[day][hour];
            cell.setResults(results);
            this[day].length = Object.keys(this[day]).length;
            return cell;
        };
        Calendar.prototype.getCell = function (day, hour, results) {
            var cell = new Cell(day, hour);
            cell.setResults(results);
            return cell;
        };
        return Calendar;
    })();
    exports.Calendar = Calendar;
    var Cell = (function () {
        function Cell(day, hour) {
            this.status = {};
            this.day = day;
            this.hour = hour;
            this.style = {
                showHour: "",
                showSpinner: "",
                showSearchResults: "display: none"
            };
            this.status = {
                searchResults: {
                    options: 0
                }
            };
        }
        Object.defineProperty(Cell.prototype, "hours", {
            get: function () {
                return ("00" + (this.hour + 1)).slice(-2);
            },
            enumerable: true,
            configurable: true
        });
        Cell.prototype.setResults = function (results) {
            this.style = {
                showHour: "display: none",
                showSpinner: "display: none",
                showSearchResults: ""
            };
            this.status = {
                searchResults: {
                    options: Math.floor(results * 6) % 6
                }
            };
        };
        Object.defineProperty(Cell.prototype, "cellClass", {
            get: function () {
                if (this.status.isSearching) {
                    return 'searching';
                }
                else if (this.status.searchResults) {
                    if (this.status.searchResults.options > 3) {
                        return 'good-results';
                    }
                    else if (this.status.searchResults.options > 1) {
                        return 'weak-results';
                    }
                    else {
                        return 'bad-results';
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Cell.prototype.updateCell = function () {
            this.setResults(Math.random());
        };
        return Cell;
    })();
    exports.Cell = Cell;
});
//# sourceMappingURL=main.js.map