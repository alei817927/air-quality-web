var jqmini = function () {
  function toggle(elm) {
    var y = elm.style && elm.style.display ? elm.style.display : 'block';
    if (y === 'block') {
      elm.style.opacity = '0';
      setTimeout(function () {
        elm.style.display = 'none';
      }, 300);
    }
    else {
      elm.style.display = 'block';
      setTimeout(function () {
        elm.style.opacity = '1';
      }, 10);
    }
  }

  function select(selector) {
    return document.querySelector(selector);
  }

  return {
    toggle: toggle,
    select: select
  };
}();