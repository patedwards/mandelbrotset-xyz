import SquareIcon from '@mui/icons-material/Square';
import { Stack, Box, IconButton } from "@mui/material";
import { useState, useEffect } from "react";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Typography from '@mui/material/Typography';
import { GithubPicker, ChromePicker } from "react-color";
import Selector from "./Selector";

const gradientFunctions = [
    {
        label: "Standard",
        name: "standard"
    },
    {
        label: "Linear Gradient",
        name: "niceGradient"
    },
    {
        label: "Pillar maker",
        name: "pillarMaker"
    }
];


const GradientStyler = ({ isActive, colors, setColors, setGradientFunction }) => {
    const [chosen, setChosen] = useState(null);

    useEffect(() => { }, [chosen, colors]);

    const handleColorChange = color => {
        console.log(color, colors[[chosen]]);
        setColors({ ...colors, [chosen]: { ...color.rgb, hex: color.hex } });
    };

    return (
        <Box sx={{ zIndex: 999, backgroundColor: "white", padding: 2 }}>
            <Stack spacing={1} alignItems="center">
                <Selector
                    items={gradientFunctions}
                    handleSelection={item => setGradientFunction(item.name)}
                />
                <Stack direction="row" alignItems="center" spacing={0} justifyContent="space-evenly">
                    <IconButton onClick={() => setChosen(chosen === "start" ? null : "start")}>
                        <SquareIcon sx={{ color: colors.start.hex }} />
                    </IconButton>
                    <Typography variant="caption" display="block">
                        {colors.start.hex}
                    </Typography>
                    <ArrowForwardIcon color="#fefefe" />
                    <IconButton onClick={() => setChosen(chosen === "middle" ? null : "middle")}>
                        <SquareIcon sx={{ color: colors.middle.hex }} />
                    </IconButton>
                    <Typography variant="caption" display="block">
                        {colors.middle.hex}
                    </Typography>
                    <ArrowForwardIcon color="#fefefe" />
                    <IconButton onClick={() => setChosen(chosen === "end" ? null : "end")}>
                        <SquareIcon sx={{ color: colors.end.hex }} />
                    </IconButton>
                    <Typography variant="caption" display="block">
                        {colors.end.hex}
                    </Typography>
                </Stack>
                {chosen !== null ? <GithubPicker
                    triangle="hide"
                    color={colors[[chosen]]}
                    onChange={handleColorChange}
                    width={"100%"}
                /> : null}
                {chosen !== null ? <ChromePicker
                    triangle="hide"
                    color={colors[[chosen]]}
                    onChange={handleColorChange}
                    width={"100%"}
                /> : null}
            </Stack>
        </Box> 
    )
}

export default GradientStyler;
