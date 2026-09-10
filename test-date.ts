import { format, parse, isValid } from 'date-fns';

const val = "31022026";
let formatted = val;
if (val.length > 2) {
  formatted = val.substring(0, 2) + '/' + val.substring(2);
}
if (val.length > 4) {
  formatted = formatted.substring(0, 5) + '/' + val.substring(4);
}
console.log(formatted);
const parsed = parse(formatted, 'dd/MM/yyyy', new Date());
console.log("Parsed:", parsed);
console.log("isValid:", isValid(parsed));
