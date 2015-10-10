import Xania = require("xania");

var binder = new Xania.Binder();

var model = { firstName: "Ibrahim", lastName: "ben Salah" };
binder.bind(document.getElementById("container"), model);

binder.update();
