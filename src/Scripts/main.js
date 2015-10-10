define(["require", "exports", "xania"], function (require, exports, Xania) {
    var binder = new Xania.Binder();
    var model = { firstName: "Ibrahim", lastName: "ben Salah" };
    binder.bind(document.getElementById("container"), model);
    binder.update();
});
//# sourceMappingURL=main.js.map