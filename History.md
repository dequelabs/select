
0.6.0 / 2014-10-30
==================

Added several accessibility-related features including

 * a logging liveregion to announce the number of matching options
 * altered event-handling to accomodate non-sighted users
 * wai-aria combobox attributes
 * additional labelling
 * other things I can't recall at the moment

0.5.1 / 2014-01-05
==================

 * NEED TO UPDATE THIS

0.5.0 / 2013-09-29
==================

 * update pillbox
 * dont search down, up or enter are down
 * make .select-single input 100% width and 100% height [jonathanong]
 * add .select-multiple class when multiple, closes #36
 * ignore enter on search, closes #38
 * meta viewport + border-box styling [jonathanong]

0.4.0 / 2013-09-24
==================

 * add .empty() to remove all options, closes #28
 * fix .remove(name) when option is selected
 * fix .deselect(name) on multiple
 * prevent propagation on touch start
 * show dropdown on search, closes #32
 * bubble .select(), should close #31
 * Use component/debounce [jonathanong]

0.3.0 / 2013-09-23
==================

 * add .unbind()
 * add .blur()
 * fix ios7 blur, closes #25
 * fix search on backspace, closes #26
 * add .focus() docs, closes #27
 * clear single select on blur, closes #21
 * use matthewmueller/debounce, closes #23
 * Load `template.html` directly [jonathanong]

0.2.0 / 2013-09-21
==================

 * add demo prop
 * use e.preventDefault() when necessary closes #15
 * show dropdown if hidden, on down / up, closes #16
 * dehighlight selected, closes #17
 * highlight on hover, closes #14
 * change single-select to have a single searchable input
 * fix mouse click / hide behavior, should close #10
 * escape shouldnt show dropdown, closes #12

0.1.0 / 2013-09-16
==================

 * add custom element support, closes #4
 * add .highlight(name) and .dehighlight(), closes #8
 * change .options to a map of name to option
 * hide dropdown on "esc"
 * fix in firefox

0.0.3 / 2013-09-14
==================

 * add .remove(name)
 * add search tests
 * add search input helper

0.0.2 / 2013-09-13
==================

 * add tests
 * better example
 * no need to use .bind within foreach [jonathanong]

0.0.1 / 2013-09-13
==================

 * Initial commit
