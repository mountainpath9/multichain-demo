import { formatUnits, parseUnits} from 'ethers/lib/utils';
import { BigNumber } from 'ethers';


import { regexStringFieldFns } from './primitive';
import { FieldFns } from './type';

/**
 * A validated field for editing a ethereum hex address
 */
export const ETH_ADDRESS_FIELD = regexStringFieldFns(
  '^\w*(0x[0-9a-fA-F]{40})\w*$',  // trims whitespace
  "an eth hex address",
  1  //  group 1 from the regexp match
);
  
/**
 * A validated field for editing an erc20 token amount with the
 * specified number of decimals.
 */
export function tokenAmountField(decimals:number): FieldFns<BigNumber> {
    const re = new RegExp('^([0-9]*[.])?[0-9]+$');

    return {
        toText(v: BigNumber) {
        return formatUnits(v, decimals);
        },
        validate(text: string) {
        if (!text.match(re)) {
            return "must be a number";
        } else {
            return null;
        }
        },
        fromText(text) {
        return parseUnits(text, decimals);
        },
        equals(v1, v2) {
        return v1 === v2;
        }
    };
}
  